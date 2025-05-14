import { SCHEMA_VERSION_TABLE } from '@/db/drizzle/version-table';
import { externalDB } from '@/db/external-db/drizzle-client';
import { promises as fs } from 'fs';
import { NextResponse, type NextRequest } from 'next/server';
import { type SchemaDefinition } from '../common';

export async function parseSQLFile(fileName: string): Promise<string> {
  return await fs.readFile(`${process.cwd()}/db/drizzle/migration/${fileName}`, 'utf-8');
}

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
  const parsed = await parseSQLFile(version.fileName);
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
      createAt: fetched.createAt,
      updateAt: fetched.updateAt ?? undefined,
    },
  };
}
