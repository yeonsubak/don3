import type {
  DeviceSyncSequenceInsert,
  EncryptKeyInsert,
  KeyRegistryInsert,
  OpLogInsert,
  OpLogSelect,
  SnapshotInsert,
  SnapshotSelect,
  SyncSchema,
  SyncStatus,
  TempKeyStoreInsert,
  UserConfigKey,
} from '@/db/sync-db/drizzle-types';
import {
  deviceSyncSequences,
  encryptKeyRegistry,
  encryptKeys,
  information,
  opLogs,
  snapshots,
  tempKeyStore,
} from '@/db/sync-db/schema';
import { and, eq, inArray, max } from 'drizzle-orm';
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

  public async hasSnapshot(): Promise<boolean> {
    const count = await this.db.$count(snapshots);
    return count > 0;
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

  public async getUploadableSnapshots(): Promise<SnapshotSelect[]> {
    const before5SecFromNow = new Date(Date.now() - 5000);
    return this.db.query.snapshots.findMany({
      where: ({ status, updateAt }, { or, and, eq, lt }) =>
        or(eq(status, 'idle'), and(eq(status, 'pending'), lt(updateAt, before5SecFromNow))),
    });
  }

  public async insertSnapshot(data: SnapshotInsert) {
    return (
      await this.db
        .insert(snapshots)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
    ).at(0);
  }

  public async updateSnapshotStatus(checksum: string, status: SyncStatus, uploadAt?: Date) {
    return (
      await this.db
        .update(snapshots)
        .set({
          status,
          updateAt: new Date(),
          uploadAt,
        })
        .where(eq(snapshots.checksum, checksum))
        .returning()
    ).at(0);
  }

  public async getUploadableOpLogs(): Promise<OpLogSelect[]> {
    const before10SecFromNow = new Date(Date.now() - 10000);
    return this.db.query.opLogs.findMany({
      where: ({ status, updateAt }, { or, and, eq, lt }) =>
        or(eq(status, 'idle'), and(eq(status, 'pending'), lt(updateAt, before10SecFromNow))),
    });
  }

  public async getUploadedOpLogIds() {
    const res = await this.db.query.opLogs.findMany({
      columns: {
        id: true,
      },
      where: ({ status }, { eq }) => eq(status, 'done'),
    });
    return res.map((e) => e.id);
  }

  public async insertOpLog(data: OpLogInsert) {
    return (
      await this.db
        .insert(opLogs)
        .values({ id: crypto.randomUUID(), ...data })
        .returning()
    ).at(0);
  }

  public async updateOpLogStatusByIds(
    ids: string[],
    status: SyncStatus,
    uploadAt?: Date,
  ): Promise<OpLogSelect[]> {
    return await this.db
      .update(opLogs)
      .set({
        status,
        uploadAt,
        updateAt: new Date(),
      })
      .where(inArray(opLogs.id, ids))
      .returning();
  }

  public async clearOpLogs() {
    return await this.db.delete(opLogs).returning();
  }

  public async getMaxSeq(deviceId: string) {
    return (
      await this.db
        .select({ value: max(opLogs.sequence) })
        .from(opLogs)
        .where(eq(opLogs.deviceId, deviceId))
    ).at(0);
  }

  public async getUserConfig(key: UserConfigKey) {
    return await this.db.query.information.findFirst({
      where: (information, { eq }) => eq(information.name, key),
    });
  }

  public async getAllDeviceSyncSequences() {
    return await this.db.query.deviceSyncSequences.findMany();
  }

  public async upsertDeviceSyncSequence(data: DeviceSyncSequenceInsert) {
    return (
      await this.db
        .insert(deviceSyncSequences)
        .values(data)
        .onConflictDoUpdate({
          target: deviceSyncSequences.deviceId,
          set: { sequence: data.sequence },
        })
        .returning()
    ).at(0);
  }

  public async clearDeviceSyncSequence() {
    return await this.db.delete(deviceSyncSequences).returning();
  }

  public async getCurrentSnapshotChecksum() {
    const keyName = 'currentSnapshotChecksum';
    return await this.db.query.information.findFirst({
      where: ({ name }, { eq }) => eq(name, keyName),
    });
  }

  public async upsertCurrentSnapshotChecksum(snapshotChecksum: string) {
    const keyName = 'currentSnapshotChecksum';
    return (
      await this.db
        .insert(information)
        .values({ name: keyName, value: snapshotChecksum })
        .onConflictDoUpdate({
          target: information.name,
          set: { value: snapshotChecksum },
        })
        .returning()
    ).at(0);
  }
}
