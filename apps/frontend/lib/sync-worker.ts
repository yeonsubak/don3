import type { Payload } from '@/dto/dto-primitives';
import type { InsertOpLogRequest, InsertSnapshotRequest, OpLogResponse } from '@/dto/sync-dto';
import type {
  WebSocketInit,
  WebSocketInternal,
  WebSocketRequest,
  WebSocketRequestType,
  WebSocketResponse,
} from '@/dto/websocket';
import { getSyncRepository } from '@/repositories/repository-helpers';
import { EncryptionService } from '@/services/encryption-service';
import { SyncService } from '@/services/sync-service';
import { RxStompState } from '@stomp/rx-stomp';
import { LOCAL_STORAGE_KEYS, SYNC_WEBSOCKET_URL } from './constants';
import { generateIV, uInt8ArrayToBase64 } from './utils/encryption-utils';

export class SyncWorker {
  private static instance: SyncWorker | null = null;
  private static initPromise: Promise<SyncWorker> | null = null;

  private websocketWorker: Worker;
  private syncService: SyncService;
  private encryptionService: EncryptionService;

  private _connectionState: RxStompState = RxStompState.CLOSED;
  private connectionStateChangeCallbacks: ((state: RxStompState) => void)[] = [];

  private syncIntervalId: ReturnType<typeof setInterval> | null = null;

  private SYNC_INTERVAL = 5000; //ms
  private DESTINATION_PATHS = [
    '/user/queue/snapshot/latest',
    '/user/queue/snapshot/insert',
    '/user/queue/opLog/insert',
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

  public get connectionState() {
    return this._connectionState;
  }

  public sendRequest(_request: {
    type: WebSocketRequestType;
    payload: Payload;
    destination: string;
  }) {
    const request: WebSocketRequest = {
      ..._request,
      requestId: crypto.randomUUID(),
      userId: this.getUserId(),
      deviceId: this.getDeviceId(),
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
      await this.insertOpLogs();
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
      const { id, schemaVersion, meta, dump } = snapshot.snapshot;
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

  private async insertOpLogs() {
    if (!this.syncService) {
      console.error('SyncService not initialized. Cannot insert operation logs.');
      return;
    }

    const opLogs = await this.syncService.getUploadableOpLogs();
    if (opLogs.length === 0) return;

    for (const log of opLogs) {
      const { id, schemaVersion, data, sequence, version, queryKeys } = log.opLog;

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
      const { type, payload, deviceId } = event.data;

      if (type === 'connectionStateUpdate') {
        this._connectionState = payload as RxStompState;
        this.connectionStateChangeCallbacks.forEach((cb) => cb(this.connectionState));
        return;
      }

      if (deviceId === this.getDeviceId()) {
        await this.ackUpload(event.data as WebSocketResponse<Payload>);
        return;
      }

      if (type === 'opLogInserted') {
        const opLog = event.data as WebSocketResponse<OpLogResponse>;
        await this.syncService.insertFetchedOpLogs(opLog.payload);
        return;
      }
    };
  }

  private sendWorkerInitMessage() {
    const payload: WebSocketInit = {
      requestId: crypto.randomUUID(),
      userId: this.getUserId(),
      deviceId: this.getDeviceId(),
      type: 'init',
      payload: {
        syncWebSocketUrl: SYNC_WEBSOCKET_URL ?? '',
        destinationPaths: this.DESTINATION_PATHS,
      },
    };

    this.websocketWorker.postMessage(payload);
  }

  private async ackUpload({ type, receiveAt, payload: { localId } }: WebSocketResponse<Payload>) {
    if (type === 'opLogInserted') {
      return await this.syncService.updateOpLogStatus(localId, 'done', receiveAt);
    }

    if (type === 'snapshotInserted') {
      return await this.syncService.updateSnapshotStatus(localId, 'done', receiveAt);
    }
  }

  private getUserId() {
    const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.USER_ID);
    if (!userId) throw new Error('userId not found.');

    return userId;
  }

  private getDeviceId() {
    const deviceId = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.DEVICE_ID);
    if (!deviceId) throw new Error('userId not found.');

    return deviceId;
  }
}
