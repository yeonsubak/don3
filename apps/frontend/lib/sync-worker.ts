import type { OpLogSelect, SnapshotSelect } from '@/db/sync-db/drizzle-types';
import type {
  Command,
  CommandType,
  Document,
  Event,
  Internal,
  Message,
  MessageType,
  OpLogChunkDTO,
  OpLogDTO,
  Query,
  QueryType,
  SnapshotDTO,
} from '@/message';
import { getSyncRepository } from '@/repositories/repository-helpers';
import { EncryptionService } from '@/services/encryption-service';
import { getBackupService } from '@/services/service-helpers';
import { SyncService } from '@/services/sync-service';
import { RxStompState } from '@stomp/rx-stomp';
import type { QueryClient } from '@tanstack/react-query';
import { AsyncQueue } from './async-queue';
import { LOCAL_STORAGE_KEYS, SYNC_WEBSOCKET_URL } from './constants';
import { generateIV, uInt8ArrayToBase64 } from './utils/encryption-utils';

type CommandQueueItem = { destination: string; command: Command<unknown> };

export class SyncWorker {
  private static instance: SyncWorker | null = null;
  private static initPromise: Promise<SyncWorker> | null = null;

  private websocketWorker: Worker;
  private deviceId: string | null = null;
  private userId: string | null = null;

  private syncService: SyncService;
  private encryptionService: EncryptionService;

  private _connectionState: RxStompState = RxStompState.CLOSED;
  private connectionStateChangeCallbacks: ((state: RxStompState) => void)[] = [];

  private commandQueue: AsyncQueue<CommandQueueItem> = new AsyncQueue();

  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private SYNC_INTERVAL = 5000; //ms

  private DESTINATION_PATHS = [
    '/user/queue/snapshot/latest',
    '/user/queue/snapshot/insert',
    '/user/queue/opLog/insert',
    '/user/queue/opLog/get',
  ];

  private constructor(syncService: SyncService, encryptionService: EncryptionService) {
    this.syncService = syncService;
    this.encryptionService = encryptionService;

    const worker = new Worker(new URL('@/public/sync-worker.js', import.meta.url), {
      type: 'module',
    });
    this.websocketWorker = worker;
    this.setWorkerOnMessage();
    this.sendWorkerInitMessage();
  }

  public static async getInstance(): Promise<SyncWorker> {
    if (SyncWorker.instance) return SyncWorker.instance;

    if (!SyncWorker.initPromise) {
      SyncWorker.initPromise = (async () => {
        const syncRepository = await getSyncRepository();
        const encryptionService = new EncryptionService(syncRepository);
        const syncService = new SyncService(syncRepository, encryptionService);
        SyncWorker.instance = new SyncWorker(syncService, encryptionService);
        return SyncWorker.instance;
      })();
    }

    return SyncWorker.initPromise;
  }

  public injectQueryClientToSyncService(queryClient: QueryClient) {
    this.syncService.injectQueryClient(queryClient);
  }

  public get connectionState() {
    return this._connectionState;
  }

  public onConnectionStateChange(callback: (state: RxStompState) => void): () => void {
    this.connectionStateChangeCallbacks.push(callback);
    callback(this._connectionState);
    return () => {
      this.connectionStateChangeCallbacks = this.connectionStateChangeCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  public async onReady() {
    const currentSnapshotChecksum = await this.syncService.getCurrentSnapshotChecksum();
    const latestSnapshotChecksum = await this.syncService.getLatestSnapshotChecksumFromServer();
    if (latestSnapshotChecksum && currentSnapshotChecksum !== latestSnapshotChecksum) {
      const { status, message } = await this.syncService.syncFromScratch(true);
      console.log(status, message);
      console.log('Database has been overwritten by the latest snapshot from the server');
      return;
    }

    const deviceIdAndSeq = await this.syncService.getAllDeviceSyncSequences();
    const savedOpLogsRes = await this.syncService.getSavedOpLogs(deviceIdAndSeq);
    if (savedOpLogsRes.statusCode === 200) {
      const opLogChunks = savedOpLogsRes.message?.body.data ?? [];
      const opLogInsertRes = await this.syncService.syncOpLogChunks(opLogChunks);
    }

    const isRefreshSnapshotRequired = await this.syncService.isRefreshShanspotRequired();
    if (isRefreshSnapshotRequired) {
      const backupService = await getBackupService();
      const { dump, metaData } = await backupService.createBackup();
      this.syncService.insertSnapshot({
        dump,
        meta: metaData,
        type: 'autosave',
        status: 'idle',
      });

      this.syncService.clearDeviceSyncSequence();
      this.syncService.clearOpLogs();

      console.log('A new snapshot has been uploaded.');
    }
  }

  public async addSnapshotsToCommandQueue(): Promise<void> {
    const toDTO = async (
      snapshot: SnapshotSelect,
      iv: Uint8Array<ArrayBuffer>,
    ): Promise<SnapshotDTO> => {
      const { schemaVersion, meta, dump, createAt } = snapshot;
      const encryptedDump = await this.encryptionService.encryptData(dump, iv);
      const encryptedMeta = await this.encryptionService.encryptData(meta, iv);
      return {
        checksum: meta.sha256,
        schemaVersion,
        iv: uInt8ArrayToBase64(iv),
        meta: encryptedMeta,
        dump: encryptedDump,
        createAt: createAt.toISOString(),
      };
    };

    const iv = generateIV();
    const snapshots: SnapshotSelect[] = await this.syncService.getUploadableSnapshots();
    for (const snapshot of snapshots) {
      const dto = await toDTO(snapshot, iv);
      this.addToCommandQueue('/app/sync/snapshot/insert', 'createSnapshot', dto);
    }
  }

  public async addOpLogsToCommandQueue(): Promise<void> {
    const toDTO = async (
      chunkId: string,
      opLog: OpLogSelect,
      iv: Uint8Array<ArrayBuffer>,
    ): Promise<OpLogDTO> => {
      const { data, version, schemaVersion, sequence, queryKeys, id } = opLog;
      const encryptedData = await this.encryptionService.encryptData(data, iv);
      const deviceId = await this.getDeviceId();
      return {
        chunkId,
        deviceId,
        localId: id,
        version,
        schemaVersion,
        sequence,
        iv: uInt8ArrayToBase64(iv),
        data: encryptedData,
        queryKeys,
      };
    };

    const chunkId = crypto.randomUUID();
    const iv = generateIV();
    const opLogs: OpLogSelect[] = await this.syncService.getUploadableOpLogs();
    const opLogDTOs = await Promise.all(opLogs.map((opLog) => toDTO(chunkId, opLog, iv)));

    if (opLogDTOs.length > 0) {
      const chunk: OpLogChunkDTO = {
        chunkId,
        opLogs: opLogDTOs,
      };

      this.addToCommandQueue('/app/sync/opLog/insert', 'createOpLog', chunk);
    }
  }

  public startIntervalSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(async () => {
      await this.addSnapshotsToCommandQueue();
      await this.addOpLogsToCommandQueue();

      // Upload commands
      const commands = await this.commandQueue.drain();
      for (const item of commands) {
        await this.sendMessage(item.destination, 'command', item.command);
      }
    }, this.SYNC_INTERVAL);
  }

  public stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  public async closeWorker() {
    this.websocketWorker.postMessage({ type: 'close' });
    this.websocketWorker.terminate();
    SyncWorker.instance = null;
    this._connectionState = RxStompState.CLOSED;
    this.connectionStateChangeCallbacks.forEach((cb) => cb(this._connectionState));
  }

  private setWorkerOnMessage() {
    this.websocketWorker.onmessage = async (event: MessageEvent<Message<unknown>>) => {
      const { type } = event.data;

      if (type === 'internal') {
        const body = event.data.body as Internal;
        if (body.type === 'connectionStateUpdate') {
          this._connectionState = body.state as RxStompState;
          this.connectionStateChangeCallbacks.forEach((cb) => cb(this.connectionState));
          return;
        }
      }

      if (type === 'event') {
        this.handleEventReceived(event.data as Message<Event<unknown>>);
        return;
      }

      if (type === 'document') {
        this.handleDocumentReceived(event.data as Message<Document<unknown>>);
        return;
      }
    };
  }

  private async sendWorkerInitMessage() {
    this.websocketWorker.postMessage({
      type: 'init',
      body: {
        type: 'init',
        syncWebSocketUrl: SYNC_WEBSOCKET_URL ?? '',
        destinationPaths: this.DESTINATION_PATHS,
      },
    });
  }

  private async addToCommandQueue(destination: string, type: CommandType, data: unknown) {
    const command: Command<unknown> = {
      timestamp: new Date().toISOString(),
      type,
      data,
    };
    await this.commandQueue.enqueue({ destination, command });
    // await this.sendMessage(destination, 'command', command);
  }

  private async sendQuery(destination: string, type: QueryType, parameters: unknown) {
    const query: Query<unknown> = {
      timestamp: new Date().toISOString(),
      type,
      parameters,
    };
    await this.sendMessage(destination, 'query', query);
  }

  private async sendMessage(destination: string, type: MessageType, body: unknown) {
    const deviceId = await this.getDeviceId();
    const requestId = crypto.randomUUID();

    const msg: Message<unknown> = {
      destination,
      type,
      requestInfo: {
        requestId,
        userId: this.getUserId(),
        deviceId,
      },
      body,
      sentAt: new Date().toISOString(),
    };

    const stringifyMsg = (msg: Message<unknown>, omitBody: boolean = true) => {
      if (omitBody) {
        msg.body = '<Body is omitted>';
      }

      return JSON.stringify(msg);
    };

    try {
      this.websocketWorker.postMessage(msg);
    } catch (err) {
      console.warn(`Failed to send message to ${destination}`, `message=${stringifyMsg}`, err);
    }
  }

  private async handleEventReceived(message: Message<Event<unknown>>) {
    const deviceId = await this.getDeviceId();
    const requestInfo = message.requestInfo;
    const body = message.body;

    if (requestInfo?.deviceId === deviceId) {
      const ack = await this.ack(body);
      return;
    }

    if (body.type === 'opLogCreated') {
      const opLogChunks = body.data as OpLogChunkDTO[];
      await this.syncOpLogs(opLogChunks);
      return;
    }
  }

  private async handleDocumentReceived(message: Message<Document<unknown>>) {
    const requestInfo = message.requestInfo;
    if (requestInfo?.deviceId !== (await this.getDeviceId())) {
      return;
    }

    const body = message.body;

    if (body.type === 'opLog') {
      const opLogChunks = body.data as OpLogChunkDTO[];
      await this.syncOpLogs(opLogChunks);
      return;
    }
  }

  private async syncOpLogs(opLogChunks: OpLogChunkDTO[]) {
    const syncResult = await this.syncService.syncOpLogChunks(opLogChunks);
  }

  private async ack({ type, timestamp, data }: Event<unknown>) {
    switch (type) {
      case 'opLogCreated': {
        const opLogIds = this.extractOpLogIds(data as OpLogChunkDTO);
        const ackResult = await this.syncService.updateOpLogStatus(opLogIds, 'done');
        return ackResult;
      }
      case 'snapshotCreated': {
        const checksum = (data as SnapshotDTO).checksum;
        return await this.syncService.updateSnapshotStatus(checksum, 'done', timestamp);
      }
    }
  }

  private extractOpLogIds(chunk: OpLogChunkDTO | OpLogChunkDTO[]): string[] {
    const extractIds = (chunk: OpLogChunkDTO) =>
      chunk.opLogs.map((e) => {
        if (!e || !e.localId) throw new Error(`localId not found. OpLog=${e}`);
        return e.localId;
      });

    if (Array.isArray(chunk)) {
      return chunk.flatMap(extractIds);
    } else {
      return extractIds(chunk);
    }
  }

  private getUserId() {
    if (this.userId) return this.userId;

    const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.USER_ID);
    if (!userId) throw new Error('userId not found.');
    this.userId = userId;
    return userId;
  }

  private async getDeviceId() {
    if (this.deviceId) return this.deviceId;

    const deviceId = await this.syncService.getUserConfig('deviceId');
    if (!deviceId) throw new Error('deviceId not found.');
    this.deviceId = deviceId.value;
    return deviceId.value;
  }
}
