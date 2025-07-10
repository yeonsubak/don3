import { PGliteAppWorker } from '@/db/pglite/pglite-app-worker';
import {
  getAccountsRepository,
  getConfigRepository,
  getSyncRepository,
  getTransactionRepository,
} from '../repositories/repository-helpers';
import { AccountsService } from './accounts-service';
import { BackupService } from './backup-service';
import { ConfigService } from './config-service';
import { EncryptionService } from './encryption-service';
import { SyncService } from './sync-service';
import { TransactionService } from './transaction-service';

export const getAccountsService = async () => {
  const accountsRepository = await getAccountsRepository();
  const configRepository = await getConfigRepository();
  const TransactionRepository = await getTransactionRepository();
  return new AccountsService(accountsRepository, configRepository, TransactionRepository);
};

export const getConfigService = async () => {
  const configRepository = await getConfigRepository();
  return new ConfigService(configRepository);
};

export const getTransactionService = async () => {
  const TransactionRepository = await getTransactionRepository();
  const accountsRepository = await getAccountsRepository();
  const configService = await getConfigService();
  return new TransactionService(TransactionRepository, accountsRepository, configService);
};

export const getBackupService = async () => {
  const worker = await PGliteAppWorker.getInstance();
  return new BackupService({ pg: worker });
};

export const getSyncService = async () => {
  const syncRepository = await getSyncRepository();
  const encryptionService = new EncryptionService(syncRepository);
  return new SyncService(syncRepository, encryptionService);
};

export const getEncryptionService = async () => {
  const syncRepository = await getSyncRepository();
  return new EncryptionService(syncRepository);
};
