import * as schema from '@/db/external-db/migration/schema';
import { EXTERNAL_DATABASE_URL, HAS_EXTERNAL_DB } from '@/lib/constants';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const externalDBClient = postgres(EXTERNAL_DATABASE_URL!, { prepare: false });

export const externalDB = HAS_EXTERNAL_DB
  ? drizzle(externalDBClient, {
      schema,
      casing: 'snake_case',
    })
  : undefined;
