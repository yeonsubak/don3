'use client';

import { drizzle as pgliteDrizzle } from 'drizzle-orm/pglite';
import { DATASET_CURRENCY_FIAT } from '../dataset/currency';
import * as schema from './schema';
import { DATASET_COUNTRY } from '../dataset/country';
import { DATASET_DEFAULT_CURRENCY_LOOKUP } from '../dataset/default-currency-lookup';
import { eq, sql } from 'drizzle-orm';

export const indexedDb = pgliteDrizzle({
  connection: 'idb://localhost:3000', // TODO: change it to .env
  schema,
  casing: 'snake_case',
});

export const initializeIndexedDb = async () => {
  // Create schemas and tables to the IndexedDb
  const sqlDump = (await (await fetch('/api/get-sql-dump', { method: 'GET' })).json()).content;
  await indexedDb.$client.exec(sqlDump);

  // Insert foundation data
  await Promise.all([
    indexedDb.insert(schema.currencies).values(DATASET_CURRENCY_FIAT).onConflictDoNothing(),
    indexedDb.insert(schema.countries).values(DATASET_COUNTRY).onConflictDoNothing(),
    indexedDb
      .insert(schema.defaultCurrencyLookup)
      .values(DATASET_DEFAULT_CURRENCY_LOOKUP)
      .onConflictDoNothing(),
  ]);

  const defaultCurrencyLookup = await indexedDb.query.defaultCurrencyLookup.findMany();
  const setDefaultCurrency = defaultCurrencyLookup.map(async ({ countryCode, currencyCode }) => {
    const currency = (
      await indexedDb
        .select()
        .from(schema.currencies)
        .where(eq(schema.currencies.code, currencyCode))
    ).at(0);
    if (currency) {
      await indexedDb
        .update(schema.countries)
        .set({ defaultCurrencyId: currency.id, updateAt: sql`NOW()` })
        .where(eq(schema.countries.code, countryCode))
        .returning();
    }
  });
  await Promise.all(setDefaultCurrency);
};

/* 
TODO: For future backend PostgreSQL server.

export const postgresDb = pgDrizzle({
  connection: 'to-be-decided-with-dotenv',
  schema,
  casing: 'snake_case',
});
*/
