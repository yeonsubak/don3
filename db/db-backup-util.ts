import { drizzle, type PgliteDrizzle } from '@/db';
import { PGlite, type Results, type Transaction } from '@electric-sql/pglite';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { strFromU8, strToU8, unzip, zipSync } from 'fflate';
import { DBInitializer } from './db-initializer';
import { PGliteWorker, type PGliteWorkerClient } from './pglite-web-worker';

type DumpMetaData = {
  fileName: string;
  schemaVersion: string;
  sha256: string;
  localStorageItems: Record<string, string>;
  timestamp: number;
};

export class DBBackupUtil {
  private db: PgliteDrizzle;
  private pg: PGliteWorkerClient;

  constructor(pg: PGliteWorker) {
    this.pg = pg as PGliteWorkerClient;
    this.db = drizzle(pg);
  }

  public async createBackup() {
    const schemaVersion = await this.db.query.information.findFirst({
      where: ({ name }, { eq }) => eq(name, 'schemaVersion'),
    });

    const timestamp = Date.now();
    const baseFileName = `don3-backup-${schemaVersion?.value ?? ''}-${timestamp}`;

    const dumpDir = await this.db.$client.dumpDataDir('none');
    const tempPg = await PGlite.create({ loadDataDir: dumpDir });

    const dumpFile = await pgDump({ pg: tempPg, fileName: `${baseFileName}.sql` });
    const dumpContent = await dumpFile.text();
    const sha256Hash = await this.generateSHA256Hash(dumpContent);

    const localStorageItems = this.getLocalStorageItems();

    const metaData: DumpMetaData = {
      fileName: dumpFile.name,
      schemaVersion: schemaVersion?.value ?? '',
      sha256: sha256Hash,
      localStorageItems,
      timestamp,
    };

    const zipped = this.bundleToZip(dumpContent, metaData);

    const blob = new Blob([zipped], { type: 'application/zip' });
    return {
      fileName: `${baseFileName}.zip`,
      url: URL.createObjectURL(blob),
    };
  }

  public async restoreDatabase(file: File) {
    const { metaData, dump } = await this.decompressZipFile(file);
    try {
      if (!metaData) throw new Error('metaData not found');
      if (!dump) throw new Error('dump not found');

      await this.pg.transaction(async (tx) => {
        try {
          await this.dropDatabase(tx);
          await tx.exec(dump);
        } catch (err) {
          tx.rollback();
          throw new Error(`${err}`);
        }
      });

      localStorage.clear();
      this.restoreLocalStorage(metaData);
      const dbInitializer = await DBInitializer.getInstance();
      await dbInitializer.initialize(true);
      return {
        status: 'success',
        metaData,
      };
    } catch (err) {
      console.error(err);
      return {
        status: 'fail',
        metaData,
      };
    }
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

  private async decompressZipFile(file: File) {
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const decompressed: { metaData: DumpMetaData | undefined; dump: string | undefined } = {
      metaData: undefined,
      dump: undefined,
    };

    unzip(uint8, (err, files) => {
      if (err) {
        console.error('Failed to unzip:', err);
        return;
      }

      for (const [filename, data] of Object.entries(files)) {
        if (!data) continue;
        const text = strFromU8(data);

        if (filename.endsWith('.json')) {
          decompressed.metaData = JSON.parse(text);
        }

        if (filename.endsWith('.sql')) {
          decompressed.dump = text;
        }
      }
    });

    return decompressed;
  }

  private async dropDatabase(tx: Transaction) {
    const schemaQueryResult: Results<{ schemaname: string }> = await tx.query(`
      SELECT DISTINCT schemaname
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
      `);
    const schemaNames = schemaQueryResult.rows.map(({ schemaname }) => schemaname);

    const dropSchemas = async (schemaName: string) => {
      const queryString = `DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`;
      return tx.query(queryString);
      // return this.db.execute(sql.raw(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`));
    };

    const dropTypes = async () => {
      await tx.query(`
        DO
        $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN
                SELECT n.nspname AS schema, t.typname AS enum_name
                FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
            LOOP
                EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', r.schema, r.enum_name);
            END LOOP;
        END
        $$;
        `);
    };

    try {
      await Promise.all(schemaNames.map(dropSchemas));
      await dropTypes();
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  private getLocalStorageItems() {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }

    const items: Record<string, string> = {};
    keys.forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) {
        items[key] = item;
      }
    });

    return items;
  }

  private restoreLocalStorage({ localStorageItems }: DumpMetaData) {
    Object.entries(localStorageItems).forEach(([key, value]) => localStorage.setItem(key, value));
  }
}
