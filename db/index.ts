import * as appSchema from '@/db/app-db/schema';
import * as syncSchema from '@/db/sync-db/schema';
import type { PGlite } from '@electric-sql/pglite';
import { drizzle as _drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import type { PGliteAppWorker } from './pglite/pglite-app-worker';

/* Common definitions */
export type Drizzle<TSchema extends Record<string, unknown>> = PgliteDatabase<TSchema> & {
  $client: PGlite;
};

interface Version {
  version: string;
  nextVersion?: string | null | undefined;
  requireMigration: boolean;
  requireDumpToUpdate: boolean;
  createAt: Date;
  updateAt?: Date;
}

export interface LocalVersion extends Version {
  fileName?: string;
}

export type RemoteVersion = Version;

/* App DB */
export type AppDrizzle = Drizzle<typeof appSchema>;

export type AppDrizzleMock = PgliteDatabase<typeof appSchema> & {
  $client: '$client is not available on drizzle.mock()';
};

export function appDrizzle(client: PGliteAppWorker): AppDrizzle {
  if (!client) {
    throw new Error('PGLite client is null');
  }

  // @ts-expect-error: type inferencing
  return _drizzle(client, { schema: appSchema, casing: 'snake_case' });
}

export const mockAppDrizzle: AppDrizzleMock = _drizzle.mock({
  schema: appSchema,
  casing: 'snake_case',
});

/* Sync DB */
export type SyncDrizzle = Drizzle<typeof syncSchema>;
export function syncDrizzle(client: PGlite): SyncDrizzle {
  if (!client) {
    throw new Error('PGLite client is null');
  }

  return _drizzle(client, { schema: syncSchema, casing: 'snake_case' });
}
