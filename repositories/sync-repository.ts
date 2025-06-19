import { encryptKeyRegistry, encryptKeys, operationLogs, tempKeyStore } from '@/db/drizzle/schema';
import type {
  EncryptKeyInsert,
  KeyRegistryInsert,
  OperationLogInsert,
  TempKeyStoreInsert,
} from '@/db/drizzle/types';
import { eq, max } from 'drizzle-orm';
import { Repository } from './abstract-repository';
import { writeOperationLog } from './repository-decorators';

export class SyncRepository extends Repository {
  public async getKeyRegistry(_credentialId: string) {
    return this.db.query.encryptKeyRegistry.findFirst({
      where: ({ credentialId }, { eq }) => eq(credentialId, _credentialId),
      with: {
        encryptKeys: true,
      },
    });
  }

  @writeOperationLog
  public async insertKeyRegistry(data: KeyRegistryInsert) {
    return (await this.db.insert(encryptKeyRegistry).values(data).returning()).at(0);
  }

  @writeOperationLog
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
}
