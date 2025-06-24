'use server';

import { APP_SCHEMA_VERSION } from '@/db/app-db/version-table';
import { externalDB } from '@/db/external-db/drizzle-client';
import type { SchemaDefinitionType } from '@/db/external-db/migration/schema';
import { SYNC_SCHEMA_VERSION } from '@/db/sync-db/version-table';
import { APP_DB_MIGRATION_PATH, SYNC_DB_MIGRATION_PATH } from '@/lib/constants';
import { promises as fs } from 'fs';
import type { SchemaDefinition } from '../../db/db-utils';

export async function parseSQLFile(type: SchemaDefinitionType, fileName: string): Promise<string> {
  const migrationPath = type === 'app' ? APP_DB_MIGRATION_PATH : SYNC_DB_MIGRATION_PATH;
  return await fs.readFile(`${process.cwd()}/${migrationPath}/${fileName}`, 'utf-8');
}

async function fetchLocal(
  type: SchemaDefinitionType,
  schemaVersion: string | null,
): Promise<SchemaDefinition | undefined> {
  if (!schemaVersion) return;

  const version =
    type === 'app' ? APP_SCHEMA_VERSION[schemaVersion] : SYNC_SCHEMA_VERSION[schemaVersion];
  const parsed = version.fileName ? await parseSQLFile(type, version.fileName) : undefined;
  return {
    sql: parsed,
    version,
  };
}

async function fetchRemote(
  type: SchemaDefinitionType,
  schemaVersion: string | null,
): Promise<SchemaDefinition | undefined> {
  if (!schemaVersion) return;

  const _version = APP_SCHEMA_VERSION[schemaVersion];
  const fetched = await externalDB?.query.schemaDefinitions.findFirst({
    where: ({ version }, { eq }) => eq(version, _version.version),
  });

  if (!fetched) return;

  return {
    sql: fetched.sqlContent,
    version: {
      version: fetched.version,
      nextVersion: fetched.nextVersion,
      requireMigration: fetched.requireMigration,
      requireDumpToUpdate: fetched.requireDumpToUpdate,
      createAt: fetched.createAt,
      updateAt: fetched.updateAt ?? undefined,
    },
  };
}

export async function getSchemaDefinition(
  type: SchemaDefinitionType,
  schemaVersion: string | null,
): Promise<SchemaDefinition | undefined> {
  const env = process.env.ENVIRONMENT ?? 'DEV';
  return env === 'PROD'
    ? await fetchRemote(type, schemaVersion)
    : await fetchLocal(type, schemaVersion);
}
