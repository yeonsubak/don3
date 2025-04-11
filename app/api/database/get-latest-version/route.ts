import { externalDB } from '@/db/external-db/drizzle-client';
import { NextResponse } from 'next/server';
import { extractSemanticVersion, listSqlFiles } from '../common';

export type Version = {
  schema: string;
  dataset: string;
};

export async function GET() {
  try {
    const env = process.env.ENVIRONMENT ?? 'DEV';
    const data = env === 'PROD' ? await fetchRemote() : await fetchLocal();

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch schema version' }, { status: 500 });
  }
}

const fetchLocal: () => Promise<Version> = async () => {
  const sqlFiles = await listSqlFiles();
  const lastSql = sqlFiles.pop();
  const schemaVersion = extractSemanticVersion(lastSql ?? '');
  const datasetVersion = '0.0.1';

  if (!schemaVersion) {
    throw new Error();
  }

  return {
    schema: schemaVersion,
    dataset: datasetVersion,
  };
};

const fetchRemote: () => Promise<Version> = async () => {
  const schemaDefinition = await externalDB?.query.schemaDefinitions.findFirst({
    columns: {
      version: true,
    },
    orderBy: ({ createAt }, { desc }) => desc(createAt),
  });

  if (!schemaDefinition) {
    throw new Error();
  }

  return {
    schema: schemaDefinition.version,
    dataset: '0.0.1',
  };
};
