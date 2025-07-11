import type { Payload } from '@/dto/dto-primitives';
import type {
  GetOpLogsRequest,
  GetOpLogsResponse,
  InsertOpLogRequest,
  InsertOpLogResponse,
  InsertSnapshotRequest,
  OpLogResponse,
} from '@/dto/sync-dto';
import type {
  WebSocketInitRequest,
  WebSocketInternal,
  WebSocketRequest,
  WebSocketRequestType,
  WebSocketResponse,
} from '@/dto/websocket';
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
  private opLogInsertBuffer: OpLogResponse[] = [];
  private opLogInsertBufferTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private OP_LOG_INSERT_BUFFER_TIMEOUT = 2000; //ms

  private _connectionState: RxStompState = RxStompState.CLOSED;
  private connectionStateChangeCallbacks: ((state: RxStompState) => void)[] = [];

  private syncIntervalId: ReturnType<typeof setInterval> | null = null;

  private SYNC_INTERVAL = 3000; //ms
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

  public async sendRequest(_request: {
    type: WebSocketRequestType;
    payload: unknown;
    destination: string;
  }) {
    const request: WebSocketRequest = {
      ..._request,
      requestId: crypto.randomUUID(),
      userId: this.getUserId(),
      deviceId: await this.getDeviceId(),
    };
    this.websocketWorker.postMessage(request);
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

  public startIntervalSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(async () => {
      await this.insertSnapshots();
      await this.uploadOpLogs();
    }, this.SYNC_INTERVAL);
  }

  public stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  private async insertSnapshots() {
    if (!this.syncService) {
      console.error('SyncService not initialized. Cannot insert snapshots.');
      return;
    }

    const snapshots = await this.syncService.getUploadableSnapshots();
    if (snapshots.length === 0) return;

    for (const snapshot of snapshots) {
      const { id, schemaVersion, meta, dump } = snapshot;
      const iv = generateIV();
      const encryptedDump = await this.encryptionService.encryptData(dump, iv);
      const encryptedMeta = await this.encryptionService.encryptData(meta, iv);
      const payload: InsertSnapshotRequest = {
        localId: id,
        schemaVersion,
        dump: encryptedDump,
        meta: encryptedMeta,
        iv: uInt8ArrayToBase64(iv),
      };

      try {
        this.sendRequest({
          type: 'insertSnapshot',
          destination: '/app/sync/snapshot/insert',
          payload,
        });
        console.log(`Snapshot ${id} sent for insertion.`);
      } catch (error) {
        console.error(`Failed to send snapshot ${id} for insertion:`, error);
      }
    }
  }

  private async uploadOpLogs() {
    if (!this.syncService) {
      console.error('SyncService not initialized. Cannot insert operation logs.');
      return;
    }

    const opLogs = await this.syncService.getUploadableOpLogs();
    if (opLogs.length === 0) return;

    for (const opLog of opLogs) {
      const { id, schemaVersion, data, sequence, version, queryKeys } = opLog;

      const iv = generateIV();
      const encryptedData = await this.encryptionService.encryptData(data, iv);
      const payload: InsertOpLogRequest = {
        localId: id,
        version,
        schemaVersion,
        sequence,
        iv: uInt8ArrayToBase64(iv),
        data: encryptedData,
        queryKeys,
      };

      try {
        this.sendRequest({
          type: 'insertOpLog',
          destination: '/app/sync/opLog/insert',
          payload,
        });
        console.log(`OpLog ${id} sent for insertion.`);
      } catch (error) {
        console.error(`Failed to send opLog ${id} for insertion:`, error);
      }
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
    this.websocketWorker.onmessage = async (
      event: MessageEvent<WebSocketResponse | WebSocketInternal>,
    ) => {
      const res = await this.ackFilter(event.data);
      if (!res) return;

      const { type, payload } = res;

      if (type === 'init') {
        await this.fetchStackedOpLogs();
        return;
      }

      if (type === 'connectionStateUpdate') {
        this._connectionState = payload as RxStompState;
        this.connectionStateChangeCallbacks.forEach((cb) => cb(this.connectionState));
        return;
      }

      if (type === 'opLogInserted') {
        const opLog = event.data as InsertOpLogResponse;
        this.opLogInsertBuffer.push(opLog.payload);
        this.insertOpLogs();
        return;
      }

      if (type === 'getOpLogsResponse') {
        const opLogs = event.data as GetOpLogsResponse;
        this.opLogInsertBuffer.push(...opLogs.payload);
        this.insertOpLogs();
        return;
      }
    };
  }

  private async sendWorkerInitMessage() {
    const payload: WebSocketInitRequest = {
      requestId: crypto.randomUUID(),
      userId: this.getUserId(),
      deviceId: await this.getDeviceId(),
      type: 'init',
      payload: {
        syncWebSocketUrl: SYNC_WEBSOCKET_URL ?? '',
        destinationPaths: this.DESTINATION_PATHS,
      },
    };

    this.websocketWorker.postMessage(payload);
  }

  private async fetchStackedOpLogs() {
    const deviceIdAndSeq = await this.syncService.getAllDeviceSyncSequences();
    const payload: GetOpLogsRequest = { deviceIdAndSeq };

    this.sendRequest({ destination: '/app/sync/opLog/get', type: 'getOpLogsRequest', payload });
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

  private async ackFilter(res: WebSocketResponse | WebSocketInternal) {
    if (res.deviceId === (await this.getDeviceId())) {
      if (['opLogInserted', 'snapshotInserted'].includes(res.type)) {
        this.ack(res as WebSocketResponse<Payload>);
        return;
      }
    }

    return res;
  }

  private async ack({ type, receiveAt, payload: { localId } }: WebSocketResponse<Payload>) {
    if (type === 'opLogInserted') {
      return await this.syncService.updateOpLogStatus(localId, 'done', receiveAt);
    }

    if (type === 'snapshotInserted') {
      return await this.syncService.updateSnapshotStatus(localId, 'done', receiveAt);
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
