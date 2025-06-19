import * as schema from '@/db/drizzle/schema';
import type { PGlite } from '@electric-sql/pglite';
import { drizzle as _drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import type { PGliteWorker } from './pglite-web-worker';

export type PgliteDrizzle = PgliteDatabase<typeof schema> & {
  $client: PGlite;
};

export type PgliteDrizzleMock = PgliteDatabase<typeof schema> & {
  $client: '$client is not available on drizzle.mock()';
};

export function drizzle(client: PGliteWorker): PgliteDrizzle {
  if (!client) {
    throw new Error('PGLite client is null');
  }

  // @ts-expect-error: type inferencing
  return _drizzle(client, { schema, casing: 'snake_case' });
}

export const mockDrizzle: PgliteDrizzleMock = _drizzle.mock({ schema, casing: 'snake_case' });
