import type { SchemaDefinition } from '@/app/api/database/common';
import type { Version } from '@/app/api/database/get-latest-version/route';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { count, type InferInsertModel, type TableConfig } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/pglite';
import { DATASET_ACCOUNT_GROUPS } from './dataset/account-groups';
import { DATASET_ACCOUNTS } from './dataset/accounts';
import { DATASET_COUNTRY } from './dataset/country';
import { DATASET_CURRENCY_FIAT } from './dataset/currency';
import type { UserConfigKey } from './drizzle/schema';
import * as schema from './drizzle/schema';
import { PgliteClient } from './pglite-client';
import type { PgliteDrizzle } from '.';

export class DBInitializer {
  private static instance: DBInitializer;
  private db!: PgliteDrizzle;

  public static isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  public static async getInstance(): Promise<DBInitializer> {
    if (!DBInitializer.instance) {
      DBInitializer.instance = new DBInitializer();
      const pg = PgliteClient.getInstance();
      const pgDrizzle = drizzle(pg!, {
        schema,
        casing: 'snake_case',
      });
      DBInitializer.instance.db = pgDrizzle;
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

  private async initialize() {
    const latestVersion = await this.getLatestVersion();
    const userSchemaVersion = window.localStorage.getItem('pglite.schemaVersion');

    if (!(await this.validateSchemaVersion(userSchemaVersion, latestVersion.schema))) {
      await this.syncSchema(userSchemaVersion);
    }

    if (!(await this.validateDataset(latestVersion.dataset))) {
      await this.syncDataset();
    }

    const missingDefaultConfigKeys = await this.getMissingDefaultConfig();
    if (missingDefaultConfigKeys.length > 0) {
      await this.insertDefaultConfig(missingDefaultConfigKeys);
    }

    if (!(await this.hasAccountGroups())) {
      await this.insertPresetData();
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEYS.PGLITE.SYNC_TIMESTAMP, `${Date.now()}`);
    DBInitializer.isInitialized = true;
  }

  private async getLatestVersion(): Promise<Version> {
    return await (await fetch('/api/database/get-latest-version', { method: 'GET' })).json();
  }

  private async validateSchemaVersion(userSchemaVersion: string | null, schemaVersion: string) {
    return userSchemaVersion === schemaVersion;
  }

  private async syncSchema(userSchemaVersion: string | null) {
    // Create schemas and tables to the IndexedDb
    const url = new URL('/api/database/get-schema-definition', window.location.origin);
    if (userSchemaVersion) url.searchParams.append('schemaVersion', userSchemaVersion);

    const fetched: SchemaDefinition[] = await (await fetch(url, { method: 'GET' })).json();

    for (const { sql, version } of fetched) {
      await this.db.$client.exec(sql);
      await this.db
        .insert(schema.information)
        .values({ name: 'schemaVersion', value: version })
        .onConflictDoUpdate({
          target: schema.information.name,
          set: { value: version },
        });

      window.localStorage.setItem(LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION, version);
    }

    console.log(
      `Synchronized the local database schema to ${window.localStorage.getItem(LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION)}`,
    );
  }

  private async validateDataset(datasetVersion: string) {
    let localDatasetVersion = window.localStorage.getItem('pglite.schemaVersion');
    return localDatasetVersion === datasetVersion;
  }

  private async syncDataset() {
    // Insert foundation data
    await Promise.all([
      this.db.insert(schema.currencies).values(DATASET_CURRENCY_FIAT).onConflictDoNothing(),
      this.db.insert(schema.countries).values(DATASET_COUNTRY).onConflictDoNothing(),
    ]);

    const version: string = '0.0.1'; // TODO: Configure dataset versioning

    await this.db
      .insert(schema.information)
      .values({ name: LOCAL_STORAGE_KEYS.PGLITE.SCHEMA_VERSION, value: version })
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
    const lang = navigator.languages.at(0);

    missingKeys.forEach(async (key) => {
      switch (key) {
        case 'defaultCurrency': {
          const countryCodeAlpha2 = lang?.substring(3, 5) ?? 'US';
          const country = await this.db.query.countries.findFirst({
            where: ({ codeAlpha2 }, { eq }) => eq(codeAlpha2, countryCodeAlpha2),
            with: { defaultCurrency: true },
          });
          await this.db
            .insert(schema.information)
            .values({ name: 'defaultCurrency', value: country?.defaultCurrency?.code ?? 'USD' })
            .onConflictDoNothing();
          break;
        }
        case 'defaultLanguage': {
          const langCodeAlpha2 = lang?.substring(0, 2) ?? 'en';
          await this.db
            .insert(schema.information)
            .values({ name: 'defaultLanguage', value: langCodeAlpha2 })
            .onConflictDoNothing();
          break;
        }
      }
    });
  }

  // TODO: Change dataset to more generic data
  private async insertPresetData() {
    type DatasetInsert = InferInsertModel<typeof schema.accountGroups | typeof schema.accounts>;

    const insertDataset = async (dataset: DatasetInsert[], table: PgTable<TableConfig>) => {
      await this.db.insert(table).values(dataset).onConflictDoNothing();
    };

    await Promise.all([
      insertDataset(DATASET_ACCOUNT_GROUPS, schema.accountGroups),
      insertDataset(DATASET_ACCOUNTS, schema.accounts),
    ]);
  }

  private async hasAccountGroups() {
    const cnt = (await this.db.select({ count: count() }).from(schema.accountGroups)).at(0)?.count;
    return (cnt ?? 0) > 0;
  }
}
