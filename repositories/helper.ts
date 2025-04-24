import { drizzle } from '@/db';
import { PGliteWorker } from '@/db/pglite-web-worker';
import { AccountsRepository } from './accounts-repository';
import { ConfigRepository } from './config-repository';
import { TransactionRepository } from './transaction-repository';

export const getAccountsRepository = async () => {
  const worker = await PGliteWorker.getInstance();
  const pg = drizzle(worker);
  return new AccountsRepository(pg);
};

export const getConfigRepository = async () => {
  const worker = await PGliteWorker.getInstance();
  const pg = drizzle(worker);
  return new ConfigRepository(pg);
};

export const getTransactionRepository = async () => {
  const worker = await PGliteWorker.getInstance();
  const pg = drizzle(worker);
  return new TransactionRepository(pg);
};
