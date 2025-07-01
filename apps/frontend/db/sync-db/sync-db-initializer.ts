import { getSchemaDefinition } from '@/app/server/db';
import * as schema from '@/db/sync-db/schema';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { drizzle } from 'drizzle-orm/pglite';
import type { SyncDrizzle } from '..';
import { getLatestSchemaVersion } from '../db-helper';
import { DBInitializer, type InitializationOptions } from '../db-initializer';
import { PGliteSync } from '../pglite/pglite-sync';
import { LATEST_CLEAN_VERSION, SYNC_SCHEMA_VERSION } from './version-table';

export class SyncDBInitializer extends DBInitializer {
  protected static instance: SyncDBInitializer | null = null;
  declare protected db: SyncDrizzle;

  public static async getInstance(): Promise<SyncDBInitializer> {
    if (!SyncDBInitializer.instance) {
      SyncDBInitializer.instance = new SyncDBInitializer();
      const pg = PGliteSync.getInstance();
      const db = drizzle(pg, {
        schema,
        casing: 'snake_case',
      });
      SyncDBInitializer.instance.pg = pg;
      SyncDBInitializer.instance.db = db;
    }

    return SyncDBInitializer.instance;
  }

  public async initialize(options?: InitializationOptions): Promise<void> {
    if (!(await this.validateSchemaVersion(options?.isDBReady))) {
      await this.syncSchema();
    }

    if (options?.closeAfterInit) {
      // await PGliteSync.closeInstance();
      SyncDBInitializer.instance = null;
      return;
    }

    this.isInitialized = true;
  }

  protected async validateSchemaVersion(isDBReady?: boolean): Promise<boolean> {
    const latestVersion = getLatestSchemaVersion(SYNC_SCHEMA_VERSION);
    const localStorageVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION);

    if (localStorageVersion || !isDBReady) {
      return localStorageVersion === latestVersion;
    }

    const dbVersion = (
      await this.db.query.information.findFirst({
        where: ({ name }, { eq }) => eq(name, 'schemaVersion'),
      })
    )?.value;

    if (dbVersion) {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION, dbVersion);
    }

    return dbVersion === latestVersion;
  }

  protected async syncSchema() {
    const currentVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION);
    const nextVersion = currentVersion
      ? SYNC_SCHEMA_VERSION[currentVersion]?.nextVersion
      : LATEST_CLEAN_VERSION.version;
    const latestVersion = getLatestSchemaVersion(SYNC_SCHEMA_VERSION);

    const updateSchema = async (nextVersion: string | undefined | null): Promise<void> => {
      if (!nextVersion) return;

      const currentVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION);
      if (currentVersion === latestVersion) return;

      const res = await getSchemaDefinition('sync', nextVersion);
      if (!res) return;

      const { sql, version } = res;

      if (sql && this.pg) {
        await this.pg.transaction(async (tx) => {
          try {
            await tx.exec(sql);
          } catch (err) {
            console.error(err);
            tx.rollback();
          }
        });
      }

      await this.db.transaction(async (tx) => {
        try {
          await tx
            .insert(schema.information)
            .values({ name: 'schemaVersion', value: version.version })
            .onConflictDoUpdate({
              target: schema.information.name,
              set: { value: version.version },
            })
            .returning();
        } catch (err) {
          console.error(err);
          tx.rollback();
        }
      });

      const storedVersion = version.requireMigration ? version.nextVersion! : version.version;

      window.localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION, storedVersion);

      console.log(`Synchronized sync db to ${storedVersion}`);

      await updateSchema(version.nextVersion);
    };

    await updateSchema(nextVersion);
  }
}
