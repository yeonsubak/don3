import { drizzle } from '@/db';
import { PGliteWorker } from '@/db/pglite-web-worker';
import { retry, type RetryOptions } from '@/lib/utils/retry';
import { xxhash3 } from 'hash-wasm';
import { AccountsRepository } from './accounts-repository';
import { ConfigRepository } from './config-repository';
import { SyncRepository } from './sync-repository';
import { TransactionRepository } from './transaction-repository';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export async function hashMethod(method: Function): Promise<string> {
  const methodString = method.toString();
  const normalized = methodString.replace(/\s+/g, '');
  return await xxhash3(normalized);
}

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

export const getSyncRepository = async () => {
  return retry(async () => {
    const worker = await PGliteWorker.getInstance();
    const pg = drizzle(worker);
    return new SyncRepository(pg);
  }, retryOption);
};
