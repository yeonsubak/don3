import { SCHEMA_VERSION_TABLE } from '@/db/drizzle/version-table';
import { externalDB } from '@/db/external-db/drizzle-client';
import { schemaDefinitions } from '@/db/external-db/migration/schema';
import { promises as fs } from 'fs';
import { NextResponse, type NextRequest } from 'next/server';
import { compareSemanticVersions, type SchemaDefinition } from '../common';

export async function parseSQLFile(fileName: string): Promise<string> {
  return await fs.readFile(`${process.cwd()}/db/drizzle/migration/${fileName}`, 'utf-8');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const schemaVersion = searchParams.get('schemaVersion');

    const env = process.env.ENVIRONMENT ?? 'DEV';
    const data = await fetchLocal(schemaVersion);
    // const data =
    //   env === 'PROD' ? await fetchRemote(schemaVersion) : await fetchLocal(schemaVersion);

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

// async function fetchRemote(schemaVersion: string | null): Promise<SchemaDefinition[]> {
//   if (!schemaVersion) {
//     const fetched: SchemaDefinition[] | undefined = (
//       await externalDB?.query.schemaDefinitions.findMany()
//     )?.map(({ version, sqlContent }) => ({ version, sql: sqlContent }));
//     if (!fetched) throw new Error('Failed to fetch schema definitions');
//     return fetched.toSorted((a, b) => compareSemanticVersions(a.version, b.version));
//   }

//   const versions = await externalDB
//     ?.select({
//       id: schemaDefinitions.id,
//       prevId: schemaDefinitions.prevId,
//       version: schemaDefinitions.version,
//     })
//     .from(schemaDefinitions);
//   if (!versions) throw new Error('Failed to fetch version list');

//   const versionIdMap = versions.reduce<
//     Record<number, { prevId: number; nextId: number | undefined }>
//   >((acc, { id, prevId }) => {
//     const next = versions.find(({ prevId }) => prevId === id);
//     acc[id] = { prevId: prevId, nextId: next?.id };
//     return acc;
//   }, {});

//   const userSchemaVersionId = versions.find(({ version }) => version === schemaVersion)?.id ?? -1;

//   const schemaDefinitionList: SchemaDefinition[] = [];
//   let nextVersionId: number | undefined = versionIdMap[userSchemaVersionId].nextId;
//   while (nextVersionId) {
//     const fetched = await externalDB?.query.schemaDefinitions.findFirst({
//       where: ({ id }, { eq }) => eq(id, nextVersionId!),
//     });
//     schemaDefinitionList.push({
//       version: fetched?.version ?? '',
//       sql: fetched?.sqlContent ?? '',
//     });

//     nextVersionId = versionIdMap[nextVersionId].nextId;
//   }

//   return schemaDefinitionList.toSorted((a, b) => compareSemanticVersions(a.version, b.version));
// }
