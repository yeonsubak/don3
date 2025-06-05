import { drizzle, type PgliteDrizzle } from '@/db';
import { PGlite } from '@electric-sql/pglite';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { strToU8, zipSync } from 'fflate';
import type { PGliteWorker } from './pglite-web-worker';

type DumpMetaData = {
  fileName: string;
  schemaVersion: string;
  sha256: string;
  timestamp: number;
};

export class DBBackupUtil {
  private pg: PGliteWorker;
  private db: PgliteDrizzle;

  constructor(pg: PGliteWorker) {
    this.pg = pg;
    this.db = drizzle(pg);
  }

  public async createBackup() {
    const schemaVersion = await this.db.query.information.findFirst({
      where: ({ name }, { eq }) => eq(name, 'schemaVersion'),
    });

    const timestamp = Date.now();
    const baseFileName = `don3-backup-${timestamp}`;

    const dumpDir = await this.db.$client.dumpDataDir('none');
    const tempPg = await PGlite.create({ loadDataDir: dumpDir });

    const dumpFile = await pgDump({ pg: tempPg, fileName: `${baseFileName}.sql` });
    const dumpContent = await dumpFile.text();
    const sha256Hash = await this.generateSHA256Hash(dumpContent);

    const metaData: DumpMetaData = {
      fileName: dumpFile.name,
      schemaVersion: schemaVersion?.value ?? '',
      sha256: sha256Hash,
      timestamp,
    };

    const zipped = this.bundleToZip(dumpContent, metaData);

    const blob = new Blob([zipped], { type: 'application/zip' });
    return {
      fileName: `${baseFileName}.zip`,
      url: URL.createObjectURL(blob),
    };
  }

  private async generateSHA256Hash(text: string) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArr = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  private bundleToZip(dumpContent: string, metaData: DumpMetaData) {
    const files: Record<string, Uint8Array> = {};
    files[metaData.fileName] = strToU8(dumpContent);
    files[`${metaData.fileName}-metadata.json`] = strToU8(JSON.stringify(metaData));

    return zipSync(files, {
      level: 7,
      mtime: metaData.timestamp,
    });
  }
}
