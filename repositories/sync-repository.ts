import type {
  EncryptKeyInsert,
  KeyRegistryInsert,
  OperationLogInsert,
  SnapshotInsert,
  SnapshotSelect,
  SnapshotSyncStatusInsert,
  SyncSchema,
  TempKeyStoreInsert,
} from '@/db/sync-db/drizzle-types';
import {
  encryptKeyRegistry,
  encryptKeys,
  operationLogs,
  snapshots,
  snapshotSyncStatus,
  tempKeyStore,
} from '@/db/sync-db/schema';
import { eq, max } from 'drizzle-orm';
import { Repository } from './abstract-repository';

export class SyncRepository extends Repository<SyncSchema> {
  public async getKeyRegistry(_credentialId: string) {
    return this.db.query.encryptKeyRegistry.findFirst({
      where: ({ credentialId }, { eq }) => eq(credentialId, _credentialId),
      with: {
        encryptKeys: true,
      },
    });
  }

  public async insertKeyRegistry(data: KeyRegistryInsert) {
    return (await this.db.insert(encryptKeyRegistry).values(data).returning()).at(0);
  }

  public async insertEncryptKey(data: EncryptKeyInsert) {
    return (await this.db.insert(encryptKeys).values(data).returning()).at(0);
  }

  public async insertOperationLog(data: OperationLogInsert) {
    return (await this.db.insert(operationLogs).values(data).returning()).at(0);
  }

  public async getValidTempKey(currentDate: Date) {
    return await this.db.query.tempKeyStore.findFirst({
      where: ({ expireAt }, { gte }) => gte(expireAt, currentDate),
      orderBy: ({ expireAt }, { desc }) => desc(expireAt),
    });
  }

  public async insertTempKey(data: TempKeyStoreInsert) {
    return (await this.db.insert(tempKeyStore).values(data).returning()).at(0);
  }

  public async getMaxSeq(deviceId: string) {
    return (
      await this.db
        .select({ value: max(operationLogs.sequence) })
        .from(operationLogs)
        .where(eq(operationLogs.deviceId, deviceId))
    ).at(0);
  }

  public async getAllSnapshots() {
    return await this.db.query.snapshots.findMany({
      with: {
        syncStatus: true,
      },
    });
  }

  public async getLatestSnapshot() {
    return await this.db.query.snapshots.findFirst({
      orderBy: ({ createAt }, { desc }) => desc(createAt),
      with: {
        syncStatus: true,
      },
    });
  }

  public async insertSnapshot(data: SnapshotInsert): Promise<SnapshotSelect | undefined> {
    return (await this.db.insert(snapshots).values(data).returning()).at(0);
  }

  public async hasSnapshot(): Promise<boolean> {
    const count = await this.db.$count(snapshots);
    return count > 0;
  }

  public async insertSnapshotSyncStatus(data: SnapshotSyncStatusInsert) {
    return (await this.db.insert(snapshotSyncStatus).values(data).returning()).at(0);
  }

  public async updateSyncStatus(data: SnapshotInsert) {
    return (
      await this.db
        .update(snapshotSyncStatus)
        .set({
          ...data,
          id: undefined,
        })
        .returning()
    ).at(0);
  }
}
