import type {
  EncryptKeyInsert,
  KeyRegistryInsert,
  OpLogInsert,
  OpLogSyncStatusInsert,
  SnapshotInsert,
  SnapshotSelect,
  SnapshotSyncStatusInsert,
  SyncSchema,
  TempKeyStoreInsert,
} from '@/db/sync-db/drizzle-types';
import {
  encryptKeyRegistry,
  encryptKeys,
  opLogs,
  opLogSyncStatus,
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
    return (
      await this.db
        .insert(encryptKeyRegistry)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
    ).at(0);
  }

  public async insertEncryptKey(data: EncryptKeyInsert) {
    return (
      await this.db
        .insert(encryptKeys)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
    ).at(0);
  }

  public async getValidTempKey(currentDate: Date) {
    return await this.db.query.tempKeyStore.findFirst({
      where: ({ expireAt }, { gte }) => gte(expireAt, currentDate),
      orderBy: ({ expireAt }, { desc }) => desc(expireAt),
    });
  }

  public async insertTempKey(data: TempKeyStoreInsert) {
    return (
      await this.db
        .insert(tempKeyStore)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
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

  public async getUploadableSnapshots() {
    return this.db.query.snapshotSyncStatus.findMany({
      where: ({ isUploaded }, { eq }) => eq(isUploaded, false),
      with: {
        snapshot: true,
      },
    });
  }

  public async hasSnapshot(): Promise<boolean> {
    const count = await this.db.$count(snapshots);
    return count > 0;
  }

  public async insertSnapshot(data: SnapshotInsert): Promise<SnapshotSelect | undefined> {
    return (
      await this.db
        .insert(snapshots)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
    ).at(0);
  }

  public async insertSnapshotSyncStatus(data: SnapshotSyncStatusInsert) {
    return (
      await this.db
        .insert(snapshotSyncStatus)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
    ).at(0);
  }

  public async updateSnapshotSyncStatus(snapshotId: string, isUploaded: boolean, uploadAt: Date) {
    const res = await this.db
      .update(snapshotSyncStatus)
      .set({
        isUploaded,
        uploadAt,
        updateAt: new Date(),
      })
      .where(eq(snapshotSyncStatus.snapshotId, snapshotId))
      .returning();
    return res.at(0);
  }

  public async getUploadableOpLogs() {
    return this.db.query.opLogSyncStatus.findMany({
      where: ({ isUploaded }, { eq }) => eq(isUploaded, false),
      with: {
        opLog: true,
      },
    });
  }

  public async insertOpLog(data: OpLogInsert) {
    return (
      await this.db
        .insert(opLogs)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
    ).at(0);
  }

  public async insertOpLogSyncStatus(data: OpLogSyncStatusInsert) {
    return (
      await this.db
        .insert(opLogSyncStatus)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
    ).at(0);
  }

  public async updateOpLogSyncStatus(opLogId: string, isUploaded: boolean, uploadAt: Date) {
    const res = await this.db
      .update(opLogSyncStatus)
      .set({
        isUploaded,
        uploadAt,
        updateAt: new Date(),
      })
      .where(eq(opLogSyncStatus.logId, opLogId))
      .returning();
    return res.at(0);
  }

  public async getMaxSeq(deviceId: string) {
    return (
      await this.db
        .select({ value: max(opLogs.sequence) })
        .from(opLogs)
        .where(eq(opLogs.deviceId, deviceId))
    ).at(0);
  }
}
