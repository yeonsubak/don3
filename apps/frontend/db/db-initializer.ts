import { type SchemaDefinition } from '@/app/api/database/common';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { IdbFs as IdbFs02, PGlite as PGlite02 } from '@electric-sql/pglite-02';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { drizzle } from 'drizzle-orm/pglite';
import type { PgliteDrizzle } from '.';
import { DATASET_ACCOUNT_GROUPS } from './dataset/account-groups';
import { DATASET_ACCOUNTS } from './dataset/accounts';
import { DATASET_COUNTRY } from './dataset/country';
import { DATASET_CURRENCY_FIAT } from './dataset/currency';
import type { UserConfigKey } from './drizzle/schema';
import * as schema from './drizzle/schema';
import {
  getLatestSchemaVersion,
  LATEST_CLEAN_VERSION,
  SCHEMA_VERSION_TABLE,
} from './drizzle/version-table';
import { PgliteClient } from './pglite-client';

export class DBInitializer {
  public static instance: DBInitializer | null;
  private pg!: PgliteClient;
  private db!: PgliteDrizzle;
  private defaultCountry!: string;
  private defaultCurrency!: string;

  public static isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  public static async getInstance(): Promise<DBInitializer> {
    if (!DBInitializer.instance) {
      DBInitializer.instance = new DBInitializer();
      const pg = PgliteClient.getInstance()!;
      const pgDrizzle = drizzle(pg!, {
        schema,
        casing: 'snake_case',
      });
      DBInitializer.instance.pg = pg;
      DBInitializer.instance.db = pgDrizzle;
      DBInitializer.instance.defaultCountry =
        localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY) ?? 'USA';
      DBInitializer.instance.defaultCurrency =
        localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY) ?? 'USD';
    }

    return DBInitializer.instance;
  }

  public async ensureDbReady() {
    if (DBInitializer.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = this.initialize();
    await this.initializationPromise;
    this.initializationPromise = null;
  }

  public static async close() {
    if (!DBInitializer.instance?.pg.closed) {
      await DBInitializer.instance?.pg.close();
    }

    DBInitializer.instance = null;
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

    window.localStorage.setItem(LOCAL_STORAGE_KEYS.PGLITE.SYNC_TIMESTAMP, `${Date.now()}`);
    DBInitializer.isInitialized = true;
  }

  private async validateSchemaVersion(isDBReady: boolean) {
    const latestVersion = getLatestSchemaVersion();
    const localStorageVersion = window.localStorage.getItem(
      LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION,
    );

    if (localStorageVersion || !isDBReady) {
      return localStorageVersion === latestVersion;
    }

    const dbVersion = (
      await this.db.query.information.findFirst({
        where: ({ name }, { eq }) => eq(name, 'schemaVersion'),
      })
    )?.value;

    if (dbVersion) {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION, dbVersion);
    }
    return dbVersion === latestVersion;
  }

  private async syncSchema() {
    const updateSchema = async (
      nextVersion: string | undefined | null,
      latestVersion: string,
      hasData: boolean,
    ) => {
      if (!nextVersion) return;

      const currentVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION);
      if (currentVersion === latestVersion) return;

      const url = new URL('/api/database/get-schema-definition', window.location.origin);
      url.searchParams.append('schemaVersion', nextVersion);
      const { sql, version }: SchemaDefinition = await (await fetch(url, { method: 'GET' })).json();

      if (hasData && version.requireDumpToUpdate) {
        await this.dumpToUpdate();
      }

      await this.pg.transaction(async (tx) => {
        if (!sql) return;

        try {
          await tx.exec(sql);
        } catch (err) {
          console.log(err);
          tx.rollback();
        }
      });

      await this.db.transaction(async (tx) => {
        try {
          return await tx
            .insert(schema.information)
            .values({ name: 'schemaVersion', value: version.version })
            .onConflictDoUpdate({
              target: schema.information.name,
              set: { value: version.version },
            })
            .returning();
        } catch (err) {
          console.log(err);
          tx.rollback();
        }
      });

      window.localStorage.setItem(
        LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION,
        version.requireMigration ? version.nextVersion! : version.version,
      );

      console.log(
        `Synchronized the local database schema to ${window.localStorage.getItem(LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION)}`,
      );

      await updateSchema(version.nextVersion, latestVersion, hasData);
    };

    const currentVersion = window.localStorage.getItem(LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION);
    const nextVersion = currentVersion
      ? SCHEMA_VERSION_TABLE[currentVersion].nextVersion
      : LATEST_CLEAN_VERSION.version;
    const latestVersion = getLatestSchemaVersion();

    await updateSchema(nextVersion, latestVersion, !!currentVersion);
  }

  private async validateDataset() {
    const latestVersion = '0.0.1';
    const localStorageVersion = window.localStorage.getItem(
      LOCAL_STORAGE_KEYS.PGLITE.DATASET_VERSION,
    );

    if (localStorageVersion) {
      return localStorageVersion === latestVersion;
    }

    const dbVersion = (
      await this.db.query.information.findFirst({
        where: ({ name }, { eq }) => eq(name, 'datasetVersion'),
      })
    )?.value;

    if (dbVersion) {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION, dbVersion);
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

    window.localStorage.setItem(LOCAL_STORAGE_KEYS.PGLITE.DATASET_VERSION, version);
    console.log(
      `Synchronized the local dataset to ${window.localStorage.getItem(LOCAL_STORAGE_KEYS.PGLITE.DATASET_VERSION)}`,
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
    missingKeys.forEach(async (key) => {
      switch (key) {
        case 'defaultCountry': {
          await this.db
            .insert(schema.information)
            .values({ name: 'defaultCountry', value: this.defaultCountry })
            .onConflictDoNothing();
          break;
        }
        case 'defaultCurrency': {
          await this.db
            .insert(schema.information)
            .values({ name: 'defaultCurrency', value: this.defaultCurrency })
            .onConflictDoNothing();
          break;
        }
        case 'defaultLanguage': {
          // TODO: Revive this when multi-language is supported
          // const langCodeAlpha2 = lang?.substring(0, 2) ?? 'en';
          await this.db
            .insert(schema.information)
            .values({ name: 'defaultLanguage', value: 'en' })
            .onConflictDoNothing();
          break;
        }
      }
    });
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
    // @ts-ignore
    const dumpResult = await pgDump({ pg: pgCurr });
    const dumpText = await dumpResult.text();

    await this.pg.exec(dumpText);
    await this.pg.exec('SET SEARCH_PATH = public;');
  }
}
