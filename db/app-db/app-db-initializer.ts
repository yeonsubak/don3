import { getSchemaDefinition } from '@/app/server/db';
import type { UserConfigKey } from '@/db/app-db/schema';
import * as schema from '@/db/app-db/schema';
import { APP_SCHEMA_VERSION, LATEST_CLEAN_VERSION } from '@/db/app-db/version-table';
import { APP_DB_NAME, LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { IdbFs as IdbFs02, PGlite as PGlite02 } from '@electric-sql/pglite-02';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { drizzle } from 'drizzle-orm/pglite';
import type { AppDrizzle } from '..';
import { DATASET_ACCOUNT_GROUPS } from '../dataset/account-groups';
import { DATASET_ACCOUNTS } from '../dataset/accounts';
import { DATASET_COUNTRY } from '../dataset/country';
import { DATASET_CURRENCY_FIAT } from '../dataset/currency';
import { getLatestSchemaVersion } from '../db-helper';
import { DBInitializer } from '../db-initializer';
import { PGliteClient } from '../pglite/pglite-client';

export class AppDBInitializer extends DBInitializer {
  protected static instance: AppDBInitializer | null = null;
  declare protected db: AppDrizzle;
  private defaultCountry!: string;
  private defaultCurrency!: string;

  public static async getInstance(): Promise<AppDBInitializer> {
    if (!AppDBInitializer.instance) {
      AppDBInitializer.instance = new AppDBInitializer();
      const pg = new PGliteClient(APP_DB_NAME);
      const db = drizzle(pg, {
        schema,
        casing: 'snake_case',
      });
      AppDBInitializer.instance.pg = pg;
      AppDBInitializer.instance.db = db;
      AppDBInitializer.instance.defaultCountry =
        localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY) ?? 'USA';
      AppDBInitializer.instance.defaultCurrency =
        localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY) ?? 'USD';
    }

    return AppDBInitializer.instance;
  }

  public async initialize(isDBReady = false) {
    if (!(await this.validateSchemaVersion(isDBReady))) {
      await this.syncSchema();
    }

    if (!(await this.validateDataset())) {
      await this.syncDataset();
    }

    const missingDefaultConfigKeys = await this.getMissingDefaultConfig();
    if (missingDefaultConfigKeys.length > 0) {
      await this.insertDefaultConfig(missingDefaultConfigKeys);
    }

    if (!(await this.hasAccounts())) {
      await this.insertPresetData();
    }

    this.clearUnusedLocalStorageValues();

    window.localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SYNC_TIMESTAMP, `${Date.now()}`);
    this.isInitialized = true;
  }

  protected async validateSchemaVersion(isDBReady: boolean) {
    const latestVersion = getLatestSchemaVersion(APP_SCHEMA_VERSION);
    const localStorageVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);

    if (localStorageVersion || !isDBReady) {
      return localStorageVersion === latestVersion;
    }

    const dbVersion = (
      await this.db.query.information.findFirst({
        where: ({ name }, { eq }) => eq(name, 'schemaVersion'),
      })
    )?.value;

    if (dbVersion) {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION, dbVersion);
    }
    return dbVersion === latestVersion;
  }

  protected async syncSchema() {
    const currentVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);
    const nextVersion = currentVersion
      ? APP_SCHEMA_VERSION[currentVersion]?.nextVersion
      : LATEST_CLEAN_VERSION.version;
    const latestVersion = getLatestSchemaVersion(APP_SCHEMA_VERSION);

    const updateSchema = async (nextVersion: string | undefined | null): Promise<void> => {
      if (!nextVersion) return;

      const currentVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);
      if (currentVersion === latestVersion) return;

      const res = await getSchemaDefinition('app', nextVersion);
      if (!res) return;

      const { sql, version } = res;

      if (currentVersion && version.requireDumpToUpdate) {
        await this.dumpToUpdate();
      }

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

      window.localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION, storedVersion);

      console.log(`Synchronized app db to ${storedVersion}`);

      await updateSchema(version.nextVersion);
    };

    await updateSchema(nextVersion);
  }

  private async validateDataset() {
    const latestVersion = '0.0.1';
    const localStorageVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DATASET_VERSION);

    if (localStorageVersion) {
      return localStorageVersion === latestVersion;
    }

    const dbVersion = (
      await this.db.query.information.findFirst({
        where: ({ name }, { eq }) => eq(name, 'datasetVersion'),
      })
    )?.value;

    if (dbVersion) {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION, dbVersion);
    }
    return dbVersion === latestVersion;
  }

  private async syncDataset() {
    // Insert foundation data
    await Promise.all([
      this.db.insert(schema.currencies).values(DATASET_CURRENCY_FIAT).onConflictDoNothing(),
      this.db.insert(schema.countries).values(DATASET_COUNTRY).onConflictDoNothing(),
      this.db.insert(schema.accountGroups).values(DATASET_ACCOUNT_GROUPS).onConflictDoNothing(),
    ]);

    const version: string = '0.0.1'; // TODO: Configure dataset versioning

    await this.db
      .insert(schema.information)
      .values({ name: 'datasetVersion', value: version })
      .onConflictDoUpdate({
        target: schema.information.name,
        set: { value: '0.0.1' },
      });

    window.localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DATASET_VERSION, version);
    console.log(
      `Synchronized the local dataset to ${window.localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DATASET_VERSION)}`,
    );
  }

  private async getMissingDefaultConfig() {
    const storedKeys = (
      await this.db
        .select({
          key: schema.information.name,
        })
        .from(schema.information)
    )?.map((e) => e.key);

    return schema.USER_CONFIG_KEYS.filter((key) => !storedKeys?.includes(key));
  }

  private async insertDefaultConfig(missingKeys: UserConfigKey[]) {
    for (const key of missingKeys) {
      switch (key) {
        case 'defaultCountry': {
          await this.db
            .insert(schema.information)
            .values({ name: key, value: this.defaultCountry })
            .onConflictDoNothing();
          break;
        }
        case 'defaultCurrency': {
          await this.db
            .insert(schema.information)
            .values({ name: key, value: this.defaultCurrency })
            .onConflictDoNothing();
          break;
        }
        case 'defaultLanguage': {
          // TODO: Revive this when multi-language is supported
          // const langCodeAlpha2 = lang?.substring(0, 2) ?? 'en';
          await this.db
            .insert(schema.information)
            .values({ name: key, value: 'en' })
            .onConflictDoNothing();
          break;
        }
        case 'deviceId': {
          await this.db
            .insert(schema.information)
            .values({
              name: key,
              value: crypto.randomUUID(),
            })
            .onConflictDoNothing();
        }
      }
    }
  }

  private async insertPresetData() {
    const country = await this.db.query.countries.findFirst({
      where: ({ code }, { eq }) => eq(code, this.defaultCountry),
    });
    const currency = await this.db.query.currencies.findFirst({
      where: ({ code }, { eq }) => eq(code, this.defaultCurrency),
    });
    if (!country || !currency) {
      throw new Error('Country data or currency data is missing');
    }

    await this.db.insert(schema.accounts).values(DATASET_ACCOUNTS(country.id, currency.id));
  }

  private async hasAccounts() {
    const cnt = await this.db.$count(schema.accounts);
    return cnt > 0;
  }

  private async dumpToUpdate() {
    const pg02 = await PGlite02.create({
      fs: new IdbFs02('don3'),
      relaxedDurability: true,
    });
    const dumpDir = await pg02.dumpDataDir('none');
    const pgCurr = await PGlite02.create({ loadDataDir: dumpDir });
    // @ts-expect-error: Only type error due to the client type mismatching
    const dumpResult = await pgDump({ pg: pgCurr });
    const dumpText = await dumpResult.text();

    await this.pg?.exec(dumpText);
    await this.pg?.exec('SET SEARCH_PATH = public;');
  }

  private clearUnusedLocalStorageValues() {
    const targetKey = ['pglite.schemaVersion', 'pglite.datasetVersion', 'pglite.syncTimestamp'];
    if (localStorage.getItem(targetKey[0])) {
      targetKey.forEach(localStorage.removeItem);
    }
  }
}
