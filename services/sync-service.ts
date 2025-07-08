import { fetchLatestSnapshot, fetchOpLogsAfterDate } from '@/app/server/sync';
import { appDrizzle } from '@/db';
import { PGliteAppWorker } from '@/db/pglite/pglite-app-worker';
import type { OpLogInsert, SnapshotInsert, SyncStatus } from '@/db/sync-db/drizzle-types';
import {
  isRestResponse,
  type OpLogResponse,
  type OpLogRestResponse,
  type SnapshotResponse,
} from '@/dto/sync-dto';
import { insertOperationLogMutex } from '@/lib/async-mutex';
import { LOCAL_STORAGE_KEYS, OPERATION_LOG_VERSION } from '@/lib/constants';
import { base64ToUint8Array, decryptWithEK } from '@/lib/utils/encryption-utils';
import { SyncRepository } from '@/repositories/sync-repository';
import type { Results } from '@electric-sql/pglite';
import type { Query } from 'drizzle-orm';
import { Service } from './abstract-service';
import { BackupService, type DumpMetaData } from './backup-service';
import type { EncryptionService } from './encryption-service';
import { getBackupService } from './service-helpers';

export class SyncService extends Service {
  private syncRepository: SyncRepository;
  private encryptionService: EncryptionService;

  constructor(syncRepository: SyncRepository, encryptionService: EncryptionService) {
    super();
    this.syncRepository = syncRepository;
    this.encryptionService = encryptionService;
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

  public async getUploadableSnapshots() {
    const snapshots = await this.syncRepository.getUploadableSnapshots();
    for (const { snapshot } of snapshots) {
      await this.syncRepository.updateSnapshotSyncStatus({
        snapshotId: snapshot.id,
        status: 'pending',
      });
    }

    return snapshots;
  }

  public async hasSnapshot() {
    return this.syncRepository.hasSnapshot();
  }

  public async insertSnapshot(data: SnapshotInsert, status: SyncStatus) {
    const res = await this.syncRepository.withTx(async (tx) => {
      try {
        const syncRepo = new SyncRepository(tx);
        const snapshot = await syncRepo.insertSnapshot(data);
        if (!snapshot) throw new Error('snapshot is undefined');

        const syncStatus = await syncRepo.insertSnapshotSyncStatus({
          snapshotId: snapshot.id,
          status,
        });

        return {
          ...snapshot,
          syncStatus,
        };
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });

    return res;
  }

  public async updateSnapshotStatus(snapshotId: string, status: SyncStatus, receiveAt: string) {
    return await this.syncRepository.updateSnapshotSyncStatus({
      snapshotId,
      status,
      uploadAt: new Date(receiveAt),
    });
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
          });

          if (!opLog) throw new Error('Result of insertOpLog is undefined');

          const syncStatus = await repo.insertOpLogSyncStatus({
            logId: opLog.id,
            status: 'idle',
          });

          return {
            ...opLog,
            syncStatus,
          };
        } catch (err) {
          console.error(err);
          tx.rollback();
        }
      });

      return res;
    });
  }

  public async updateOpLogStatus(logId: string, status: SyncStatus, receiveAt: string) {
    return await this.syncRepository.updateOpLogSyncStatus(logId, status, new Date(receiveAt));
  }

  public async getUploadableOpLogs() {
    const opLogs = await this.syncRepository.getUploadableOpLogs();
    for (const { opLog } of opLogs) {
      await this.syncRepository.updateOpLogSyncStatus(opLog.id, 'pending');
    }
    return opLogs;
  }

  public async syncFromScratch(): Promise<{ status: 'success' | 'fail'; message: string }> {
    const ek = await this.encryptionService.getValidEncryptionKey(true);
    if (!ek) throw new Error('Retrieving an encryption key failed.');

    const deviceId = await this.syncRepository.getUserConfig('deviceId');
    if (!deviceId) throw new Error('deviceId not found.');

    const snapshotRes = await this.getLatestSnapshotFromServer();

    switch (snapshotRes.statusCode) {
      case 200: {
        const { dump, meta, iv: ivBase64, schemaVersion } = snapshotRes.data;
        const iv = base64ToUint8Array(ivBase64);

        const decryptedDump = await decryptWithEK(dump, iv, ek);
        const decryptedMeta: DumpMetaData = JSON.parse(await decryptWithEK(meta, iv, ek));

        const decompressedDump = decryptedMeta.compressed
          ? BackupService.decompressGzipBase64(decryptedDump)
          : decryptedDump;
        decryptedMeta.compressed = false;

        const insertedSnapshot = await this.insertSnapshot(
          {
            schemaVersion,
            type: 'autosave',
            meta: decryptedMeta,
            dump: decompressedDump,
            deviceId: deviceId.value,
          },
          'done',
        );

        const backupService = await getBackupService();
        const restoreRes = await backupService.restoreDB(
          {
            metaData: decryptedMeta,
            dump: decompressedDump,
          },
          false,
        );

        const opLogs = await this.getOpLogsAfterSnapshotDate(snapshotRes.data);
        const opLogRestoreRes = await this.insertFetchedOpLogs(opLogs);

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

  public async insertFetchedOpLogs(opLogRes: OpLogRestResponse | OpLogResponse) {
    const res: { deviceId: string; seq: number; res: Results<unknown> }[] = [];

    const insert = async ({ data, iv: ivBase64, sequence, deviceId }: OpLogResponse) => {
      const iv = base64ToUint8Array(ivBase64);
      const decryptedData = await this.encryptionService.decryptData(data, iv);
      const { sql, params }: Query = JSON.parse(decryptedData);
      const drizzle = appDrizzle(await PGliteAppWorker.getInstance());
      const queryRes = await drizzle.$client.query(sql, params);
      res.push({ deviceId, seq: sequence, res: queryRes });
    };

    if (isRestResponse(opLogRes)) {
      const { data } = opLogRes as OpLogRestResponse;
      for (const log of data) {
        await insert(log);
      }
    } else {
      const opLog = opLogRes as OpLogResponse;
      await insert(opLog);
    }

    const lastLog = res[res.length - 1];
    if (lastLog) {
      await this.upsertDeviceSyncSequence(lastLog.deviceId, lastLog.seq);
    }

    return res;
  }

  private async upsertDeviceSyncSequence(deviceId: string, sequence: number) {
    const updateResult = await this.syncRepository.updateDeviceSyncSequence({ deviceId, sequence });
    return updateResult
      ? updateResult
      : await this.syncRepository.insertDeviceSyncSequence({ deviceId, sequence });
  }

  private async getLatestSnapshotFromServer() {
    return fetchLatestSnapshot();
  }

  private async getOpLogsAfterSnapshotDate(snapshotRes: SnapshotResponse) {
    const date = new Date(snapshotRes.createAt);
    return fetchOpLogsAfterDate(date);
  }
}
