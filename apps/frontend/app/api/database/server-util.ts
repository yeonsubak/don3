import { promises as fs } from 'fs';

export async function parseSQLFile(fileName: string): Promise<string> {
  return await fs.readFile(`${process.cwd()}/db/drizzle/migration/${fileName}`, 'utf-8');
}
