import type { PGlite } from '@electric-sql/pglite';
import type { NodePgClient, NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from './schema';

export type DrizzleClient =
  | undefined
  | (PgliteDatabase<typeof schema> & {
      $client: PGlite;
    })
  | (NodePgDatabase<typeof schema> & {
      $client: NodePgClient;
    });

export type CountryInsert = typeof schema.countries.$inferInsert;
export type CountrySelect = typeof schema.countries.$inferSelect;

export type CurrencyInsert = typeof schema.currencies.$inferInsert;
export type CurrencySelect = typeof schema.currencies.$inferSelect;

export type DefaultCurrencyLookupInsert = typeof schema.defaultCurrencyLookup.$inferInsert;
export type DefaultCurrencyLookupSelect = typeof schema.defaultCurrencyLookup.$inferSelect;
