import { drizzle } from '@/db';
import { PGliteWorker } from '@/db/pglite-web-worker';
import { retry, type RetryOptions } from '@/lib/utils/retry';
import { AccountsRepository } from './accounts-repository';
import { ConfigRepository } from './config-repository';
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
    const worker = await PGliteWorker.getInstance();
    const pg = drizzle(worker);
    return new AccountsRepository(pg);
  }, retryOption);
};

export const getConfigRepository = async () => {
  return retry(async () => {
    const worker = await PGliteWorker.getInstance();
    const pg = drizzle(worker);
    return new ConfigRepository(pg);
  }, retryOption);
};

export const getTransactionRepository = async () => {
  return retry(async () => {
    const worker = await PGliteWorker.getInstance();
    const pg = drizzle(worker);
    return new TransactionRepository(pg);
  }, retryOption);
};
