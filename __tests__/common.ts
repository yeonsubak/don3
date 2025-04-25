import { fetchLocal } from '@/app/api/database/get-schema-definition/route';
import type { PgliteDrizzle } from '@/db';
import { DATASET_ACCOUNT_GROUPS } from '@/db/dataset/account-groups';
import { DATASET_COUNTRY } from '@/db/dataset/country';
import { DATASET_CURRENCY_FIAT } from '@/db/dataset/currency';
import * as schema from '@/db/drizzle/schema';
import { MemoryFS, PGlite } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';
import type { InferInsertModel, TableConfig } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/pglite';

export const printTestResult = (input: unknown, expected: unknown, result: unknown) => {
  console.log(`Input: ${input} | Expected: ${expected} | Got: ${result}`);
};

export async function createInMemoryPGLiteDrizzle(): Promise<PgliteDrizzle> {
  const pg = new PGlite({ fs: new MemoryFS(), relaxedDurability: true, extensions: { live } });
  const db = drizzle(pg, {
    schema,
    casing: 'snake_case',
  });

  const sqls = await fetchLocal(null);

  for (const { sql } of sqls) {
    await db.$client.exec(sql);
  }

  await Promise.all([
    db.insert(schema.currencies).values(DATASET_CURRENCY_FIAT).onConflictDoNothing(),
    db.insert(schema.countries).values(DATASET_COUNTRY).onConflictDoNothing(),
  ]);

  // Dataset
  type DatasetInsert = InferInsertModel<typeof schema.accountGroups | typeof schema.accounts>;

  const insertDataset = async (dataset: DatasetInsert[], table: PgTable<TableConfig>) => {
    await db.insert(table).values(dataset).onConflictDoNothing();
  };

  await Promise.all([insertDataset(DATASET_ACCOUNT_GROUPS, schema.accountGroups)]);

  return db;
}
