import { appDrizzle, syncDrizzle } from '@/db';
import { PGliteAppWorker } from '@/db/pglite/pglite-app-worker';
import { PGliteSync } from '@/db/pglite/pglite-sync';
import { SyncDBInitializer } from '@/db/sync-db/sync-db-initializer';
import { retry, type RetryOptions } from '@/lib/utils/retry';
import { AccountsRepository } from './accounts-repository';
import { ConfigRepository } from './config-repository';
import { SyncRepository } from './sync-repository';
import { TransactionRepository } from './transaction-repository';

const retryOption: RetryOptions = {
  retries: 3,
  baseDelayMs: 100,
  jitter: true,
  onError: (err, attempt) => {
    console.error(`Attempt ${attempt + 1} failed:`, err);
  },
};

export const getAccountsRepository = async () => {
  return retry(async () => {
    const pg = await PGliteAppWorker.getInstance(true);
    const drizzle = appDrizzle(pg);
    return new AccountsRepository(drizzle);
  }, retryOption);
};

export const getConfigRepository = async () => {
  return retry(async () => {
    const pg = await PGliteAppWorker.getInstance(true);
    const drizzle = appDrizzle(pg);
    return new ConfigRepository(drizzle);
  }, retryOption);
};

export const getTransactionRepository = async () => {
  return retry(async () => {
    const pg = await PGliteAppWorker.getInstance(true);
    const drizzle = appDrizzle(pg);
    return new TransactionRepository(drizzle);
  }, retryOption);
};

export const getSyncRepository = async () => {
  return retry(async () => {
    const pg = PGliteSync.getInstance();
    await pg.waitReady;
    const drizzle = syncDrizzle(pg);
    const initializer = await SyncDBInitializer.getInstance();
    await initializer.ensureDbReady();
    return new SyncRepository(drizzle);
  }, retryOption);
};
