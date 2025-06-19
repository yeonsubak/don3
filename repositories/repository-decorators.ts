'use client';

import { DECORATOR_NAME_KEY_SYMBOL, LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { getSyncService } from '@/services/service-helpers';
import { hashMethod } from './repository-helpers';

export function writeOperationLog(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  descriptor.value[DECORATOR_NAME_KEY_SYMBOL] = 'writeOperationLog';

  if (typeof localStorage === 'undefined') {
    return descriptor;
  }

  const originalMethod = descriptor.value;

  const isSyncEnabled = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SYNC_ENABLED) === 'true';
  if (!isSyncEnabled) {
    return descriptor;
  }

  descriptor.value = async function (...args: unknown[]) {
    const className = this.constructor.name;
    const methodName = propertyKey;
    const hash = await hashMethod(originalMethod);

    try {
      const result = await originalMethod.apply(this, args);

      console.log('@writeOperationLog', `${className}.${methodName}`, result);

      const syncService = await getSyncService();
      await syncService.insertOperationLog(`${className}.${methodName}`, hash, result);

      return result;
    } catch (err) {
      console.error(err);
    }
  };

  return descriptor;
}
