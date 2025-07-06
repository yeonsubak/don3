import type { InsertOpLogRequest, InsertSnapshotRequest } from '@/dto/sync-dto';
import type {
  PendingRequest,
  PendingRequests,
  WebSocketInit,
  WebSocketInternal,
  WebSocketRequest,
  WebSocketResponse,
} from '@/dto/websocket';
import { getSyncService } from '@/services/service-helpers';
import type { SyncService } from '@/services/sync-service';
import { RxStompState } from '@stomp/rx-stomp';
import { LOCAL_STORAGE_KEYS, SYNC_WEBSOCKET_URL } from './constants';
import { generateIV, uInt8ArrayToBase64 } from './utils/encryption-utils';

export class SyncWorker {
  private static instance: SyncWorker | null = null;
  private websocketWorker: Worker;
  private syncService: SyncService | null = null;

  private userId: string = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.USER_ID) ?? '';
  private pendingRequests: PendingRequests = new Map();

  private _connectionState: RxStompState = RxStompState.CLOSED;
  private connectionStateChangeCallbacks: ((state: RxStompState) => void)[] = [];

  private syncIntervalId: ReturnType<typeof setInterval> | null = null;

  private SYNC_INTERVAL = 2000; //ms
  private DESTINATION_PATHS = [
    '/user/queue/snapshot/latest',
    '/user/queue/snapshot/insert',
    '/user/queue/opLog/insert',
  ];

  private constructor() {
    const worker = new Worker(new URL('@/public/sync-worker.js', import.meta.url), {
      type: 'module',
    });
    this.websocketWorker = worker;
    this.setWorkerOnMessage();
    this.sendWorkerInitMessage();
  }

  private setWorkerOnMessage() {
    this.websocketWorker.onmessage = async (
      event: MessageEvent<WebSocketResponse | WebSocketInternal>,
    ) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'connectionStateUpdate': {
          this._connectionState = payload as RxStompState;
          this.connectionStateChangeCallbacks.forEach((cb) => cb(this.connectionState));
          return;
        }
        default: {
          const { message, requestId } = event.data as WebSocketResponse;
          const req = this.pendingRequests.get(requestId);
          if (!req) return;

          const handler = req.handler;

          if (type === 'error') {
            handler.reject(new Error(message ?? 'Unknown error from worker'));
          } else {
            handler.resolve(payload);
          }

          await req.posthook?.(event.data as WebSocketResponse);

          this.pendingRequests.delete(requestId);
        }
      }
    };
  }

  private sendWorkerInitMessage() {
    const payload: WebSocketInit = {
      type: 'init',
      payload: {
        syncWebSocketUrl: SYNC_WEBSOCKET_URL ?? '',
        destinationPaths: this.DESTINATION_PATHS,
      },
    };

    this.websocketWorker.postMessage(payload);
  }

  public static async getInstance(): Promise<SyncWorker> {
    if (!SyncWorker.instance) {
      SyncWorker.instance = new SyncWorker();
      SyncWorker.instance.syncService = await getSyncService();
    }

    return SyncWorker.instance;
  }

  public get connectionState() {
    return this._connectionState;
  }

  public sendRequest({
    type,
    destination,
    payload,
  }: Omit<WebSocketRequest, 'requestId'>): Promise<unknown> {
    const requestId = crypto.randomUUID();

    let posthook: ((res: WebSocketResponse) => Promise<void>) | undefined;
    // Add posthook to certain types
    switch (type) {
      case 'insertOpLog': {
        const { localId } = payload as InsertOpLogRequest;
        posthook = async (res) => {
          const status = await this.syncService?.updateOpLogStatus(localId, true, res.receiveAt);
        };
        break;
      }
      case 'insertSnapshot': {
        const { localId } = payload as InsertSnapshotRequest;
        posthook = async (res) => {
          const status = await this.syncService?.updateSnapshotStatus(localId, true, res.receiveAt);
        };
        break;
      }
    }

    return new Promise((resolve, reject) => {
      const pendingRequest: PendingRequest = {
        type,
        handler: { resolve, reject },
        posthook,
      };
      this.pendingRequests.set(requestId, pendingRequest);
      this.websocketWorker.postMessage({ requestId, type, destination, payload });
    });
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
      const { id, deviceId, schemaVersion, meta, dump } = snapshot.snapshot;
      const iv = generateIV();
      const encryptedDump = await this.syncService.encryptData(dump, iv);
      const encryptedMeta = await this.syncService.encryptData(meta, iv);
      const payload: InsertSnapshotRequest = {
        userId: this.userId,
        deviceId,
        localId: id,
        schemaVersion,
        dump: encryptedDump,
        meta: encryptedMeta,
        iv: uInt8ArrayToBase64(iv),
      };

      try {
        await this.sendRequest({
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
      const { id, deviceId, schemaVersion, data, sequence, version } = log.opLog;

      const iv = generateIV();
      const encryptedData = await this.syncService.encryptData(data, iv);
      const payload: InsertOpLogRequest = {
        userId: this.userId,
        deviceId,
        localId: id,
        version,
        schemaVersion,
        sequence,
        iv: uInt8ArrayToBase64(iv),
        data: encryptedData,
      };

      try {
        await this.sendRequest({
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
}
