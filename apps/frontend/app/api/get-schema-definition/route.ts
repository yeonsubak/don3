import { externalDB } from '@/db/external-db/drizzle-client';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import { extractOrderFromFileName } from './functions';

type Data = { sql: string; version: string };

export async function GET() {
  try {
    const env = process.env.ENVIRONMENT ?? 'DEV';
    const data = env === 'PROD' ? await importExternal() : await importLocal();

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch sql scripts' }, { status: 500 });
  }
}

const importLocal: () => Promise<Data> = async () => {
  const sqlFiles = await fs.readdir('db/drizzle/migration');
  const sqlFilePaths = sqlFiles
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => extractOrderFromFileName(a) - extractOrderFromFileName(b));

  const sqlScripts: Record<number, string> = {};

  const fetchSqlScripts = sqlFilePaths.map((fileName) =>
    fs.readFile(`${process.cwd()}/db/drizzle/migration/${fileName}`, 'utf8').then((content) => {
      const order = extractOrderFromFileName(fileName);
      if (order >= 0) {
        sqlScripts[order] = content;
      }
    }),
  );

  await Promise.all(fetchSqlScripts);

  const combinedSql = Object.keys(sqlScripts)
    .map((order) => sqlScripts[Number(order)])
    .join('\n');

  return {
    sql: combinedSql,
    version: '0.0.1',
  };
};

const importExternal: () => Promise<Data> = async () => {
  const sql = await externalDB?.query.schemaDefinitions.findFirst();
  if (!sql) throw new Error('Failed to fetch sql scripts');

  // TODO: Implement fetching next version;

  return {
    sql: sql.sqlContent,
    version: sql.version,
  };
};
