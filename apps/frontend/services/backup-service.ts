import { appDrizzle, type AppDrizzle } from '@/db';
import { AppDBInitializer } from '@/db/app-db/app-db-initializer';
import type { PGliteAppWorker } from '@/db/pglite/pglite-app-worker';
import { PGliteClient } from '@/db/pglite/pglite-client';
import { base64ToUint8Array, uInt8ArrayToBase64 } from '@/lib/utils/encryption-utils';
import { PGlite, type Results, type Transaction } from '@electric-sql/pglite';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import type { PgliteClient } from 'drizzle-orm/pglite';
import { gunzipSync, gzipSync, strFromU8, strToU8, unzip, zipSync } from 'fflate';
import { Service } from './abstract-service';

export type DumpMetaData = {
  fileName: string;
  schemaVersion: string;
  sha256: string;
  localStorageItems: Record<string, string>;
  compressed: boolean;
  timestamp: number;
};

export type BackupObject = {
  dump: string;
  metaData: DumpMetaData;
  baseFileName: string;
};

export class BackupService extends Service {
  private pg?: PGliteAppWorker | PgliteClient;
  private db?: AppDrizzle;

  constructor({ pg, db }: { pg?: PGliteAppWorker; db?: AppDrizzle }) {
    super();
    if (pg) {
      this.pg = pg;
      this.db = appDrizzle(pg);
      return;
    }

    if (db) {
      this.db = db;
      this.pg = db.$client;
      return;
    }

    throw new Error('All arguments passed to the constructor are undefined');
  }

  public async createBackup(): Promise<BackupObject> {
    const schemaVersion = await this.db?.query.information.findFirst({
      where: ({ name }, { eq }) => eq(name, 'schemaVersion'),
    });

    const timestamp = Date.now();
    const baseFileName = `don3-backup-${schemaVersion?.value ?? ''}-${timestamp}`;

    const dumpDir = await this.db?.$client.dumpDataDir('none');
    const tempPg = await PGlite.create({ loadDataDir: dumpDir });

    const dumpFile = await pgDump({ pg: tempPg, fileName: `${baseFileName}.sql` });
    const dump = await dumpFile.text();

    // Compress dump file to base64
    const compressedDump = BackupService.compressGzipBase64(dump);

    const sha256Hash = await BackupService.generateSHA256Hash(dump);

    const localStorageItems = this.getLocalStorageItems();

    const metaData: DumpMetaData = {
      fileName: dumpFile.name,
      schemaVersion: schemaVersion?.value ?? '',
      sha256: sha256Hash,
      localStorageItems,
      compressed: true,
      timestamp,
    };

    return {
      dump: compressedDump,
      metaData,
      baseFileName,
    };
  }

  public async exportToZip(
    compressedDumpBase64: string,
    metaData: DumpMetaData,
    baseFileName: string,
  ): Promise<{ fileName: string; url: string }> {
    const zipped = this.bundleToZip(compressedDumpBase64, metaData);
    const blob = new Blob([zipped], { type: 'application/zip' });
    return {
      fileName: `${baseFileName}.zip`,
      url: URL.createObjectURL(blob),
    };
  }

  public async restoreDB(
    restoreObj: File | Omit<BackupObject, 'baseFileName'>,
    overwrite: boolean,
  ) {
    const { metaData, dump } =
      restoreObj instanceof File ? await BackupService.decompressZipFile(restoreObj) : restoreObj;

    if (!metaData) throw new Error('metaData not found');
    if (!dump) throw new Error('dump not found');

    return await this.restore(dump, metaData, overwrite);
  }

  public async migrateDB(newIndexDbName: string, dumpObj?: BackupObject) {
    const newPg = new PGliteClient(newIndexDbName);
    const { dump, metaData } = dumpObj ? dumpObj : await this.createBackup();
    return await this.restore(dump, metaData, false, newPg);
  }

  private async restore(
    dump: string,
    meta: DumpMetaData,
    overwrite: boolean,
    pgInstance?: PGlite | PGliteAppWorker,
  ) {
    const pg = pgInstance ?? this.pg;
    if (meta.compressed) {
      dump = BackupService.decompressGzipBase64(dump);
    }

    if (overwrite) {
      await pg?.transaction(async (tx) => {
        try {
          await this.dropDatabase(tx);
          await tx.exec(dump);
        } catch (err) {
          tx.rollback();
          console.error(err);
          return {
            status: 'fail',
            meta,
          };
        }
      });
    } else {
      await pg?.exec(dump);
    }

    // In case of migrating from local
    if (!pgInstance) {
      localStorage.clear();
      this.restoreLocalStorage(meta.localStorageItems);
    }

    if (overwrite) {
      window.location.reload();
    }

    return {
      status: 'success',
      meta,
    };
  }

  public static async generateSHA256Hash(text: string) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArr = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  public static compressGzipBase64(original: string) {
    const compressed = gzipSync(strToU8(original));
    return uInt8ArrayToBase64(compressed);
  }

  public static decompressGzipBase64(compressed: string) {
    return strFromU8(gunzipSync(base64ToUint8Array(compressed)));
  }

  public static async decompressZipFile(file: File) {
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const res: { metaData: DumpMetaData | undefined; dump: string | undefined } = {
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
          res.metaData = JSON.parse(text);
        }

        if (filename.endsWith('.sql')) {
          const decompressed = this.decompressGzipBase64(text);
          res.dump = decompressed;
        }
      }
    });

    return res;
  }

  private async dropDatabase(tx: Transaction) {
    const schemaQueryResult: Results<{ schemaname: string }> = await tx.query(`
        SELECT DISTINCT schemaname
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
        `);
    const schemaNames = schemaQueryResult.rows.map(({ schemaname }) => schemaname);

    const dropSchema = async (schemaName: string) => {
      const queryString = `DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`;
      return await tx.exec(queryString);
      // return this.db.execute(sql.raw(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`));
    };

    const dropTypes = async () => {
      return await tx.exec(`
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
      for (const name of schemaNames) {
        const dropResult = await dropSchema(name);
      }
      await dropTypes();
    } catch (err) {
      throw new Error(`${err}`);
    }
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

  private restoreLocalStorage(localStorageItems: Record<string, string>) {
    Object.entries(localStorageItems).forEach(([key, value]) => localStorage.setItem(key, value));
  }
}
