'use client';

import { DECORATOR_NAME_KEY_SYMBOL } from '@/lib/constants';
import { getSyncService } from '@/services/service-helpers';
import type { Query } from 'drizzle-orm';

export function writeOpLog(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  descriptor.value[DECORATOR_NAME_KEY_SYMBOL] = 'writeOpLog';

  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    return descriptor;
  }

  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const queryBuilder = originalMethod.apply(this, args);
    const query: Query = queryBuilder.toSQL();

    const mutateResult = await queryBuilder;

    try {
      const syncService = await getSyncService();
      const res = await syncService.insertOpLog(query);
    } catch (err) {
      console.error(err);
    }

    return mutateResult;
  };

  return descriptor;
}
