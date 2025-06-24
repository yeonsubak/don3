'use client';

import type { AppDrizzle } from '@/db';
import type { PgliteTransaction } from '@/db/drizzle-types';
import { DECORATOR_NAME_KEY_SYMBOL, LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { SyncService } from '@/services/sync-service';
import { ConfigRepository } from './config-repository';
import { hashMethod } from './repository-helpers';
import { SyncRepository } from './sync-repository';

export function writeOperationLog(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  descriptor.value[DECORATOR_NAME_KEY_SYMBOL] = 'writeOperationLog';

  if (
    typeof localStorage === 'undefined' ||
    localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SYNC_ENABLED) !== 'true'
  ) {
    return descriptor;
  }

  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const className = this.constructor.name;
    const methodName = propertyKey;
    const hash = await hashMethod(originalMethod);
    //@ts-expect-error: `this` refers to the class
    const db = this.db as AppDrizzle | PgliteTransaction;

    try {
      const mutateResult = await originalMethod.apply(this, args);

      const syncRepository = new SyncRepository(db);
      const configRepository = new ConfigRepository(db);
      const syncService = new SyncService(syncRepository, configRepository);

      await syncService.insertOperationLog(`${className}.${methodName}`, hash, mutateResult);

      return mutateResult;
    } catch (err) {
      console.error(err);
    }
  };

  return descriptor;
}
