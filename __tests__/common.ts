import { parseSQLFile } from '@/app/server/db';
import type { AppDrizzle } from '@/db';
import * as schema from '@/db/app-db/schema';
import { APP_SCHEMA_VERSION, LATEST_CLEAN_VERSION } from '@/db/app-db/version-table';
import { DATASET_ACCOUNT_GROUPS } from '@/db/dataset/account-groups';
import { DATASET_COUNTRY } from '@/db/dataset/country';
import { DATASET_CURRENCY_FIAT } from '@/db/dataset/currency';
import type { SchemaDefinitionType } from '@/db/external-db/migration/schema';
import { MemoryFS, PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { live } from '@electric-sql/pglite/live';
import type { InferInsertModel, TableConfig } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/pglite';

export const printTestResult = (input: unknown, expected: unknown, result: unknown) => {
  console.log(`Input: ${input} | Expected: ${expected} | Got: ${result}`);
};

export async function createInMemoryPGLiteDrizzle(type: SchemaDefinitionType): Promise<AppDrizzle> {
  const pg = new PGlite({
    fs: new MemoryFS(),
    relaxedDurability: true,
    extensions: { live, uuid_ossp },
  });
  const db = drizzle(pg, {
    schema,
    casing: 'snake_case',
  });

  if (!LATEST_CLEAN_VERSION.fileName) {
    throw new Error('Invalid fileName');
  }

  const majorDDL = await parseSQLFile(type, LATEST_CLEAN_VERSION.fileName);
  const minorDDLs: string[] = [];
  let nextVersion = LATEST_CLEAN_VERSION.nextVersion;
  while (nextVersion) {
    const next = APP_SCHEMA_VERSION[nextVersion];
    if (next.fileName) {
      const ddl = await parseSQLFile(type, next.fileName);
      minorDDLs.push(ddl);
    }

    nextVersion = next.nextVersion;
  }

  await pg.transaction(async (tx) => {
    try {
      await tx.exec(majorDDL);
      for (const ddl of minorDDLs) {
        await tx.exec(ddl);
      }
    } catch (err) {
      console.error(err);
      await tx.rollback();
      throw new Error('Database initialization failed.');
    }
  });

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
