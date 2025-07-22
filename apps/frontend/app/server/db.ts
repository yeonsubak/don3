'use server';

import type { LocalVersion } from '@/db';
import { APP_SCHEMA_VERSION } from '@/db/app-db/version-table';
import type { SchemaDefinition } from '@/db/db-helper';
import { externalDB } from '@/db/external-db/drizzle-client';
import type { SchemaDefinitionType } from '@/db/external-db/migration/schema';
import { SYNC_SCHEMA_VERSION } from '@/db/sync-db/version-table';
import { APP_DB_MIGRATION_PATH, SYNC_DB_MIGRATION_PATH } from '@/lib/constants';
import { promises as fs } from 'fs';

export async function parseSQLFile(type: SchemaDefinitionType, fileName: string): Promise<string> {
  const migrationPath = type === 'app' ? APP_DB_MIGRATION_PATH : SYNC_DB_MIGRATION_PATH;
  return await fs.readFile(`${process.cwd()}/${migrationPath}/${fileName}`, 'utf-8');
}

export async function getSchemaDefinition(
  type: SchemaDefinitionType,
  schemaVersion: string | null,
): Promise<SchemaDefinition | undefined> {
  async function fetchLocal(
    type: SchemaDefinitionType,
    version: LocalVersion,
  ): Promise<SchemaDefinition | undefined> {
    const parsed = version.fileName ? await parseSQLFile(type, version.fileName) : undefined;
    return {
      sql: parsed,
      version,
    };
  }

  async function fetchRemote(
    type: SchemaDefinitionType,
    version: LocalVersion,
  ): Promise<SchemaDefinition | undefined> {
    const fetched = await externalDB?.query.schemaDefinitions.findFirst({
      where: (column, { and, eq }) =>
        and(eq(column.version, version.version), eq(column.type, type)),
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

  if (!schemaVersion) return;

  const env = process.env.DEPLOYED_ENVIRONMENT ?? 'local';
  const version =
    type === 'app' ? APP_SCHEMA_VERSION[schemaVersion] : SYNC_SCHEMA_VERSION[schemaVersion];
  return env === 'vercel' ? await fetchRemote(type, version) : await fetchLocal(type, version);
}
