import { SCHEMA_VERSION_TABLE } from '@/db/drizzle/version-table';
import { externalDB } from '@/db/external-db/drizzle-client';
import { NextResponse, type NextRequest } from 'next/server';
import { type SchemaDefinition } from '../common';
import { parseSQLFile } from '../server-util';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const schemaVersion = searchParams.get('schemaVersion');

    const env = process.env.ENVIRONMENT ?? 'DEV';
    const data =
      env === 'PROD' ? await fetchRemote(schemaVersion) : await fetchLocal(schemaVersion);

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch sql scripts' }, { status: 500 });
  }
}

export async function fetchLocal(
  schemaVersion: string | null,
): Promise<SchemaDefinition | undefined> {
  if (!schemaVersion) return;

  const version = SCHEMA_VERSION_TABLE[schemaVersion];
  const parsed = version.fileName ? await parseSQLFile(version.fileName) : undefined;
  return {
    sql: parsed,
    version,
  };
}

async function fetchRemote(schemaVersion: string | null): Promise<SchemaDefinition | undefined> {
  if (!schemaVersion) return;

  const _version = SCHEMA_VERSION_TABLE[schemaVersion];
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
