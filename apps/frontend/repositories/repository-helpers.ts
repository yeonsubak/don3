import { appDrizzle, syncDrizzle } from '@/db';
import { PGliteAppWorker } from '@/db/pglite/pglite-app-worker';
import { SYNC_DB_NAME } from '@/lib/constants';
import { retry, type RetryOptions } from '@/lib/utils/retry';
import { IdbFs, PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { live } from '@electric-sql/pglite/live';
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
    const pg = await PGliteAppWorker.getInstance();
    const drizzle = appDrizzle(pg);
    return new AccountsRepository(drizzle);
  }, retryOption);
};

export const getConfigRepository = async () => {
  return retry(async () => {
    const pg = await PGliteAppWorker.getInstance();
    const drizzle = appDrizzle(pg);
    return new ConfigRepository(drizzle);
  }, retryOption);
};

export const getTransactionRepository = async () => {
  return retry(async () => {
    const pg = await PGliteAppWorker.getInstance();
    const drizzle = appDrizzle(pg);
    return new TransactionRepository(drizzle);
  }, retryOption);
};

export const getSyncRepository = async () => {
  return retry(async () => {
    const pg = await PGlite.create({
      fs: new IdbFs(SYNC_DB_NAME),
      relaxedDurability: true,
      extensions: { uuid_ossp, live },
    });
    const drizzle = syncDrizzle(pg);
    return new SyncRepository(drizzle);
  }, retryOption);
};
