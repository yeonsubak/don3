import type { OpLogSelect, SnapshotSelect } from '@/db/sync-db/drizzle-types';
import type {
  Command,
  CommandType,
  DeviceSyncState,
  Document,
  Event,
  Internal,
  Message,
  MessageType,
  OpLogDTO,
  Query,
  QueryType,
  SnapshotDTO,
} from '@/message';
import { getSyncRepository } from '@/repositories/repository-helpers';
import { EncryptionService } from '@/services/encryption-service';
import { SyncService } from '@/services/sync-service';
import { RxStompState } from '@stomp/rx-stomp';
import type { QueryClient } from '@tanstack/react-query';
import { LOCAL_STORAGE_KEYS, SYNC_WEBSOCKET_URL } from './constants';
import { generateIV, uInt8ArrayToBase64 } from './utils/encryption-utils';

export class SyncWorker {
  private static instance: SyncWorker | null = null;
  private static initPromise: Promise<SyncWorker> | null = null;

  private websocketWorker: Worker;

  private syncService: SyncService;
  private encryptionService: EncryptionService;

  private queryClient: QueryClient | null = null;
  private opLogInsertBuffer: OpLogDTO[] = [];
  private opLogInsertBufferTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private OP_LOG_INSERT_BUFFER_TIMEOUT = 1500; //ms

  private _connectionState: RxStompState = RxStompState.CLOSED;
  private connectionStateChangeCallbacks: ((state: RxStompState) => void)[] = [];

  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private SYNC_INTERVAL = 5000; //ms

  private DESTINATION_PATHS = [
    '/user/queue/snapshot/latest',
    '/user/queue/snapshot/insert',
    '/user/queue/opLog/insert',
    '/user/queue/opLog/get',
  ];

  private deviceId: string | null = null;
  private userId: string | null = null;

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

  public injectQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
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

  public async uploadSnapshot(snapshot: SnapshotSelect) {
    const toSnapshotDTO = async ({ id, schemaVersion, meta, dump, createAt }: SnapshotSelect) => {
      const iv = generateIV();
      const encryptedDump = await this.encryptionService.encryptData(dump, iv);
      const encryptedMeta = await this.encryptionService.encryptData(meta, iv);
      return {
        localId: id,
        schemaVersion,
        iv: uInt8ArrayToBase64(iv),
        meta: encryptedMeta,
        dump: encryptedDump,
        createAt: createAt.toISOString(),
      };
    };

    const snapshotDTO = await toSnapshotDTO(snapshot);

    try {
      await this.sendCommand('/app/sync/snapshot/insert', 'createSnapshot', snapshotDTO);
      console.log(`Snapshot ${snapshot.id} sent for upload.`);
    } catch (error) {
      console.error(`Failed to send snapshot ${snapshot.id} for upload:`, error);
    }
  }

  public async uploadOpLog(opLog: OpLogSelect) {
    const toOpLogDTO = async ({
      id,
      schemaVersion,
      data,
      sequence,
      version,
      queryKeys,
    }: OpLogSelect) => {
      const iv = generateIV();
      const encryptedData = await this.encryptionService.encryptData(data, iv);
      const deviceId = await this.getDeviceId();
      return {
        localId: id,
        deviceId,
        version,
        schemaVersion,
        sequence,
        iv: uInt8ArrayToBase64(iv),
        data: encryptedData,
        queryKeys,
      };
    };

    const opLogDTO = await toOpLogDTO(opLog);

    try {
      await this.sendCommand('/app/sync/opLog/insert', 'createOpLog', opLogDTO);
      console.log(`OpLog ${opLog.id} sent for upload.`);
    } catch (error) {
      console.error(`Failed to send opLog ${opLog.id} for upload:`, error);
    }
  }

  public startIntervalSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(async () => {
      const snapshots = await this.syncService.getUploadableSnapshots();
      for (const snapshot of snapshots) {
        await this.uploadSnapshot(snapshot);
      }

      const opLogs = await this.syncService.getUploadableOpLogs();
      for (const opLog of opLogs) {
        await this.uploadOpLog(opLog);
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
        if (body.type === 'init' && body.state === 'ready') {
          await this.fetchStackedOpLogs();
          return;
        }

        if (body.type === 'connectionStateUpdate') {
          this._connectionState = body.state as RxStompState;
          this.connectionStateChangeCallbacks.forEach((cb) => cb(this.connectionState));
          return;
        }
      }

      if (type === 'event') {
        this.handleEventReceived(event.data);
        return;
      }

      if (type === 'document') {
        this.handleDocumentReceived(event.data);
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

  private async fetchStackedOpLogs() {
    const deviceIdAndSeq: DeviceSyncState[] = await this.syncService.getAllDeviceSyncSequences();
    this.sendQuery('/app/sync/opLog/get', 'getOpLogs', deviceIdAndSeq);
  }

  private async sendCommand(destination: string, type: CommandType, data: unknown) {
    const command: Command<unknown> = {
      commandId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: type,
      data,
    };
    await this.sendMessage(destination, 'command', command);
  }

  private async sendQuery(destination: string, type: QueryType, parameters: unknown) {
    const query: Query<unknown> = {
      queryId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: type,
      parameters,
    };
    await this.sendMessage(destination, 'query', query);
  }

  private async sendMessage(destination: string, type: MessageType, body: unknown) {
    const deviceId = await this.getDeviceId();
    const message: Message<unknown> = {
      destination,
      type,
      requestInfo: {
        requestId: crypto.randomUUID(),
        userId: this.getUserId(),
        deviceId,
      },
      body,
      sentAt: new Date().toISOString(),
    };
    this.websocketWorker.postMessage(message);
  }

  private async handleEventReceived(message: Message<unknown>) {
    const requestInfo = message.requestInfo;
    const body = message.body as Event<OpLogDTO | SnapshotDTO>;
    if (requestInfo?.deviceId === (await this.getDeviceId())) {
      const ack = await this.ack(body);
      return;
    }

    if (body.type === 'opLogCreated') {
      const opLog = body.data as OpLogDTO;
      this.opLogInsertBuffer.push(opLog);
      this.insertOpLogs();
      return;
    }
  }

  private async handleDocumentReceived(message: Message<unknown>) {
    const requestInfo = message.requestInfo;
    if (requestInfo?.deviceId !== (await this.getDeviceId())) {
      return;
    }

    const body = message.body as Document<OpLogDTO | SnapshotDTO>;

    if (body.type === 'opLog') {
      const opLog = body.data as OpLogDTO;
      this.opLogInsertBuffer.push(opLog);
      this.insertOpLogs();
      return;
    }
  }

  private async insertOpLogs() {
    if (this.opLogInsertBufferTimeoutId) {
      clearTimeout(this.opLogInsertBufferTimeoutId);
    }

    this.opLogInsertBufferTimeoutId = setTimeout(async () => {
      const sortedBySeqASC = this.opLogInsertBuffer.toSorted((a, b) => a.sequence - b.sequence);

      const insertResult = await this.syncService.insertFetchedOpLogs(sortedBySeqASC);

      // Invalidate query keys
      const queryKeySet = new Set(sortedBySeqASC.flatMap((e) => e.queryKeys));
      const queryKeys = Array.from(queryKeySet);
      try {
        await this.queryClient?.invalidateQueries({ queryKey: queryKeys });
        console.log('Query keys has been invalidated:', queryKeys);
      } catch (err) {
        console.error('Error invalidating queries:', queryKeys, err);
      }

      // Clear buffer
      this.opLogInsertBuffer = [];
    }, this.OP_LOG_INSERT_BUFFER_TIMEOUT);
  }

  private async ack({ type, timestamp, data: { localId } }: Event<OpLogDTO | SnapshotDTO>) {
    if (type === 'opLogCreated') {
      return await this.syncService.updateOpLogStatus(localId, 'done', timestamp);
    }

    if (type === 'snapshotCreated') {
      return await this.syncService.updateSnapshotStatus(localId, 'done', timestamp);
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
