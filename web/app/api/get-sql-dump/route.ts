import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';

export const extractOrderFromFileName = (fileName: string) => {
  const match = fileName.match(/(\d[^_.-\D]+)/);
  return match ? Number(match[0]) : -1;
};

export async function GET() {
  try {
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
      })
    );

    await Promise.all(fetchSqlScripts);

    const combinedSql = Object.keys(sqlScripts)
      .map((order) => sqlScripts[Number(order)])
      .join('\n');

    return NextResponse.json({ content: combinedSql });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: 'Failed to fetch the sql scripts' }, { status: 500 });
  }
}
