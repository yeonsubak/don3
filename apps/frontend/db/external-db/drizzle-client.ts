import * as schema from '@/db/external-db/migration/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const externalDatabaseUrl = process.env.EXTERNAL_DATABASE_URL;

const externalDBClient = postgres(externalDatabaseUrl!, { prepare: false });

export const externalDB = externalDatabaseUrl
  ? drizzle(externalDBClient, {
      schema,
      casing: 'snake_case',
    })
  : undefined;
