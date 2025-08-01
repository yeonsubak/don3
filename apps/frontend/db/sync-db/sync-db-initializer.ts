import { getSchemaDefinition } from '@/app/server/db';
import * as schema from '@/db/sync-db/schema';
import { getSession } from '@/lib/better-auth/auth-client';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { drizzle } from 'drizzle-orm/pglite';
import type { SyncDrizzle } from '..';
import { getLatestSchemaVersion } from '../db-helper';
import { DBInitializer, type InitializationOptions } from '../db-initializer';
import { PGliteSync } from '../pglite/pglite-sync';
import { USER_CONFIG_KEYS, type UserConfigKey } from './drizzle-types';
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

    const missingConfigKeys = await this.getMissingConfig([...USER_CONFIG_KEYS]);
    if (missingConfigKeys.length > 0) {
      await this.insertMissingConfig(missingConfigKeys);
    }

    if (options?.closeAfterInit) {
      SyncDBInitializer.instance = null;
      return;
    }

    this.isInitialized = true;
  }

  protected async validateSchemaVersion(isDBReady?: boolean): Promise<boolean> {
    const latestVersion = getLatestSchemaVersion(SYNC_SCHEMA_VERSION);
    const localStorageVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION);

    if (localStorageVersion || !isDBReady) {
      return localStorageVersion === latestVersion;
    }

    const dbVersion = (
      await this.db.query.information.findFirst({
        where: ({ name }, { eq }) => eq(name, 'schemaVersion'),
      })
    )?.value;

    if (dbVersion) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION, dbVersion);
    }

    return dbVersion === latestVersion;
  }

  protected async syncSchema() {
    const currentVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION);
    const nextVersion = currentVersion
      ? SYNC_SCHEMA_VERSION[currentVersion]?.nextVersion
      : LATEST_CLEAN_VERSION.version;
    const latestVersion = getLatestSchemaVersion(SYNC_SCHEMA_VERSION);

    const updateSchema = async (nextVersion: string | undefined | null): Promise<void> => {
      if (!nextVersion) return;

      const currentVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION);
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

      localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC.SCHEMA_VERSION, storedVersion);

      console.log(`Synchronized sync db to ${storedVersion}`);

      await updateSchema(version.nextVersion);
    };

    await updateSchema(nextVersion);
  }

  protected async insertMissingConfig(missingKeys: UserConfigKey[]): Promise<void> {
    for (const key of missingKeys) {
      switch (key) {
        case 'deviceId': {
          const deviceId = crypto.randomUUID();
          await this.db
            .insert(schema.information)
            .values({
              name: key,
              value: deviceId,
            })
            .onConflictDoNothing();
          break;
        }
      }
      switch (key) {
        case 'userId': {
          let userId = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.USER_ID);

          if (!userId) {
            console.warn('userId not found in localStorage.');
            const session = await getSession();
            userId = session.user?.id ?? null;
            if (!userId) {
              console.warn('userId not found in session.');
              return;
            }
          }

          await this.db
            .insert(schema.information)
            .values({ name: key, value: userId })
            .onConflictDoUpdate({
              target: schema.information.name,
              set: { value: userId },
            });
          break;
        }
      }
    }
  }
}
