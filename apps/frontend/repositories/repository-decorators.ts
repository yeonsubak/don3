'use client';

import { DECORATOR_NAME_KEY_SYMBOL } from '@/lib/constants';
import { getSyncService } from '@/services/service-helpers';
import { hashMethod } from './repository-helpers';

export function writeOperationLog(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  descriptor.value[DECORATOR_NAME_KEY_SYMBOL] = 'writeOperationLog';

  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    return descriptor;
  }

  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const className = this.constructor.name;
    const methodName = propertyKey;
    const hash = await hashMethod(originalMethod);

    const mutateResult = await originalMethod.apply(this, args);

    try {
      const syncService = await getSyncService();
      await syncService.insertOperationLog(`${className}.${methodName}`, hash, mutateResult);
    } catch (err) {
      console.error(err);
    }

    return mutateResult;
  };

  return descriptor;
}
