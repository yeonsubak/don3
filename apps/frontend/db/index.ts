import * as schema from '@/db/drizzle/schema';
import type { PGlite } from '@electric-sql/pglite';
import { drizzle as _drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import type { PGliteWorker } from './pglite-web-worker';

export type PgliteDrizzle = PgliteDatabase<typeof schema> & {
  $client: PGlite;
};

export function drizzle(client: PGliteWorker): PgliteDrizzle {
  if (!client) {
    throw new Error('PGLite client is null');
  }

  // @ts-expect-error
  return _drizzle(client, { schema, casing: 'snake_case' });
}
