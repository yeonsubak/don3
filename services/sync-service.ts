import {
  fetchLatestSnapshot,
  fetchLatestSnapshotChecksum,
  fetchOpLogsAfterDate,
  fetchRefreshSnapshotRequired,
  fetchSavedOpLogs,
} from '@/app/server/sync';
import { appDrizzle } from '@/db';
import { PGliteAppWorker } from '@/db/pglite/pglite-app-worker';
import type {
  OpLogInsert,
  OpLogSelect,
  SnapshotSelect,
  SnapshotType,
  SyncStatus,
  UserConfigKey,
} from '@/db/sync-db/drizzle-types';
import { insertOperationLogMutex } from '@/lib/async-mutex';
import { LOCAL_STORAGE_KEYS, OPERATION_LOG_VERSION } from '@/lib/constants';
import { base64ToUint8Array, decryptWithEK } from '@/lib/utils/encryption-utils';
import type { DeviceSyncState, OpLogChunkDTO, OpLogDTO, RequestInfo } from '@/message';
import { SyncRepository } from '@/repositories/sync-repository';
import type { Results } from '@electric-sql/pglite';
import type { QueryClient } from '@tanstack/react-query';
import type { Query } from 'drizzle-orm';
import { Service } from './abstract-service';
import { BackupService, type DumpMetaData } from './backup-service';
import type { EncryptionService } from './encryption-service';
import { getBackupService } from './service-helpers';

export class SyncService extends Service {
  private syncRepository: SyncRepository;
  private encryptionService: EncryptionService;
  private queryClient: QueryClient | null = null;

  constructor(syncRepository: SyncRepository, encryptionService: EncryptionService) {
    super();
    this.syncRepository = syncRepository;
    this.encryptionService = encryptionService;
  }

  public injectQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  public async getNextSeq(deviceId: string) {
    const currentMaxSeq = (await this.syncRepository.getMaxSeq(deviceId))?.value;
    return !currentMaxSeq ? 1 : currentMaxSeq + 1;
  }

  public async getAllSnapshots() {
    return await this.syncRepository.getAllSnapshots();
  }

  public async getLatestSnapshot() {
    return this.syncRepository.getLatestSnapshot();
  }

  public async getUploadableSnapshots(): Promise<SnapshotSelect[]> {
    const snapshots = await this.syncRepository.getUploadableSnapshots();
    for (const { checksum } of snapshots) {
      await this.updateSnapshotStatus(checksum, 'pending');
    }

    return snapshots;
  }
  public async hasSnapshot() {
    return this.syncRepository.hasSnapshot();
  }

  public async insertSnapshot({
    type,
    meta,
    dump,
    status,
  }: {
    type: SnapshotType;
    meta: DumpMetaData;
    dump: string;
    status?: SyncStatus;
  }) {
    const res = await this.syncRepository.withTx(async (tx) => {
      try {
        const syncRepo = new SyncRepository(tx);
        const snapshot = await syncRepo.insertSnapshot({
          type,
          dump,
          meta,
          schemaVersion: meta.schemaVersion,
          checksum: meta.sha256,
          status,
        });
        if (!snapshot) throw new Error('snapshot is undefined');

        const currentSnapshotId = await syncRepo.upsertCurrentSnapshotChecksum(meta.sha256);

        return snapshot;
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });

    return res;
  }

  public async updateSnapshotStatus(checksum: string, status: SyncStatus, receiveAt?: string) {
    return await this.syncRepository.updateSnapshotStatus(
      checksum,
      status,
      receiveAt ? new Date(receiveAt) : undefined,
    );
  }

  public async getUploadableOpLogs(): Promise<OpLogSelect[]> {
    const opLogs = await this.syncRepository.getUploadableOpLogs();
    const opLogIds = opLogs.map((opLog) => opLog.id);
    await this.updateOpLogStatus(opLogIds, 'pending');

    return opLogs;
  }

  public async insertOpLog(
    query: Query,
    tanstackQueryKeys: string[],
  ): Promise<OpLogInsert | undefined> {
    return await insertOperationLogMutex.runExclusive(async () => {
      const deviceId = await this.syncRepository.getUserConfig('deviceId');
      const appSchemaVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);
      if (!deviceId) throw new Error('deviceId not found.');
      if (!appSchemaVersion) throw new Error('schemaVersion not found.');

      const nextSeq = await this.getNextSeq(deviceId.value);

      const res = await this.syncRepository.withTx(async (tx) => {
        const repo = new SyncRepository(tx);
        try {
          const opLog = await repo.insertOpLog({
            version: OPERATION_LOG_VERSION,
            schemaVersion: appSchemaVersion,
            deviceId: deviceId.value.replace(/\s+/g, ''),
            sequence: nextSeq,
            data: query,
            queryKeys: tanstackQueryKeys,
            status: 'idle',
          });

          return opLog;
        } catch (err) {
          console.error(err);
          tx.rollback();
        }
      });

      return res;
    });
  }

  public async updateOpLogStatus(ids: string[], status: SyncStatus): Promise<OpLogSelect[]> {
    return await this.syncRepository.updateOpLogStatusByIds(ids, status);
  }

  public async syncFromScratch(
    overwrite: boolean,
  ): Promise<{ status: 'success' | 'fail'; message: string }> {
    const ek = await this.encryptionService.getValidEncryptionKey(true);
    if (!ek) throw new Error('Retrieving an encryption key failed.');

    const deviceId = await this.syncRepository.getUserConfig('deviceId');
    if (!deviceId) throw new Error('deviceId not found.');

    const snapshotRes = await this.getLatestSnapshotFromServer();

    switch (snapshotRes.statusCode) {
      case 200: {
        const { dump, meta, iv: ivBase64, createAt, checksum } = snapshotRes.message!.body.data;
        const iv = base64ToUint8Array(ivBase64);

        const decryptedDump = await decryptWithEK(dump, iv, ek);
        const decryptedMeta: DumpMetaData = JSON.parse(await decryptWithEK(meta, iv, ek));

        const decompressedDump = decryptedMeta.compressed
          ? BackupService.decompressGzipBase64(decryptedDump)
          : decryptedDump;
        decryptedMeta.compressed = false;

        const backupService = await getBackupService();
        const restoreRes = await backupService.restoreDB(
          {
            metaData: decryptedMeta,
            dump: decompressedDump,
          },
          overwrite,
        );

        const currentSnapshotChecksum =
          await this.syncRepository.upsertCurrentSnapshotChecksum(checksum);

        await this.clearDeviceSyncSequence();
        await this.clearOpLogs();

        const opLogRes = await this.getOpLogsAfterSnapshotDate(createAt!);
        if (opLogRes.statusCode === 200) {
          const opLogChunks = opLogRes.message?.body.data ?? [];
          const opLogInsertRes = await this.syncOpLogChunks(opLogChunks);
        }

        return {
          status: 'success',
          message: 'Syncing database from the cloud success.',
        };
      }
      case 404: {
        console.warn('Snapshot data not found in the server.');
      }
      default: {
        return {
          status: 'fail',
          message: 'Sync failed. StatusCode: ${snapshot.statusCode}. Reroute to ?syncSignIn=false.',
        };
      }
    }
  }

  public async syncOpLogChunks(opLogChunks: OpLogChunkDTO[]) {
    const res: { deviceId: string; seq: number; res: Results<unknown>; queryKeys: string[] }[] = [];
    const deviceIdSeqs: Record<string, number> = {};
    const drizzle = appDrizzle(await PGliteAppWorker.getInstance());

    const insert = async ({ data, iv: ivBase64, sequence, deviceId, queryKeys }: OpLogDTO) => {
      const iv = base64ToUint8Array(ivBase64);
      const decryptedData = await this.encryptionService.decryptData(data, iv);
      const { sql, params }: Query = JSON.parse(decryptedData);
      const queryRes = await drizzle.$client.query(sql, params);
      res.push({ deviceId, seq: sequence, res: queryRes, queryKeys });
      deviceIdSeqs[deviceId] = sequence;
    };

    for (const { opLogs } of opLogChunks) {
      for (const opLog of opLogs) {
        await insert(opLog);
      }
    }

    for (const [deviceId, seq] of Object.entries(deviceIdSeqs)) {
      await this.upsertDeviceSyncSequence(deviceId, seq);
    }

    // Invalidate query keys
    const queryKeySet = new Set(res.flatMap((e) => e.queryKeys));
    await this.invalidateQueries(Array.from(queryKeySet), true);

    return res;
  }

  public async getAllDeviceSyncSequences(): Promise<DeviceSyncState[]> {
    const result = await this.syncRepository.getAllDeviceSyncSequences();
    return result.map(({ deviceId, sequence }) => ({ deviceId, seq: sequence }));
  }

  public async clearOpLogs() {
    return await this.syncRepository.clearOpLogs();
  }

  public async clearDeviceSyncSequence() {
    return await this.syncRepository.clearDeviceSyncSequence();
  }

  public async getUserConfig(key: UserConfigKey) {
    return await this.syncRepository.getUserConfig(key);
  }

  public async getSavedOpLogs(deviceIdAndSeq: DeviceSyncState[]) {
    const userId = await this.getUserConfig('userId');
    if (!userId) throw new Error('userId not found.');
    const deviceId = await this.getUserConfig('deviceId');
    if (!deviceId) throw new Error('deviceId not found.');

    const requestInfo: RequestInfo = {
      userId: userId.value,
      deviceId: deviceId.value,
      requestId: crypto.randomUUID(),
    };

    return fetchSavedOpLogs(deviceIdAndSeq, requestInfo);
  }

  public async getLatestSnapshotFromServer() {
    return fetchLatestSnapshot();
  }

  public async getCurrentSnapshotChecksum() {
    const res = await this.syncRepository.getCurrentSnapshotChecksum();
    return res?.value;
  }

  private async invalidateQueries(queryKeys: string[], invalidateAll: boolean) {
    if (queryKeys.length === 0) {
      return;
    }

    if (!this.queryClient) {
      console.warn('SyncService.queryClient not found.');
      return;
    }

    try {
      if (invalidateAll) {
        await this.queryClient.invalidateQueries({
          predicate: () => true,
          type: 'all',
          refetchType: 'all',
        });
        console.log('All queries have been invalidated.');
        return;
      }

      await this.queryClient.invalidateQueries({ queryKey: Array.from(queryKeys) });
      console.log('Query keys has been invalidated:', queryKeys);
    } catch (err) {
      console.error('Error invalidating queries:', queryKeys, err);
    }
  }

  public async getLatestSnapshotChecksumFromServer() {
    const res = await fetchLatestSnapshotChecksum();
    if (res.statusCode === 200) {
      return res.message?.body.data.checksum;
    }

    return undefined;
  }

  public async isRefreshShanspotRequired() {
    const res = await fetchRefreshSnapshotRequired();
    return res.message?.body.data.required ?? false;
  }

  private async upsertDeviceSyncSequence(deviceId: string, sequence: number) {
    return await this.syncRepository.upsertDeviceSyncSequence({ deviceId, sequence });
  }

  private async getOpLogsAfterSnapshotDate(snapshotDate: string) {
    const date = new Date(snapshotDate);
    return fetchOpLogsAfterDate(date);
  }
}
