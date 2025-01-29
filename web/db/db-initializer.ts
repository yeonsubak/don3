import type { Version } from '@/app/api/get-latest-version/route';
import { DemoService } from '@/app/services/demo-service';
import { eq } from 'drizzle-orm';
import { DATASET_COUNTRY } from './dataset/country';
import { DATASET_CURRENCY_FIAT } from './dataset/currency';
import * as schema from './drizzle/schema';
import { type PgliteDrizzle } from './pglite-web-worker';
import { drizzle } from 'drizzle-orm/pglite';
import { PgliteClient } from './pglite-client';

export class DBInitializer {
  private static instance: DBInitializer;
  public static DEFAULT_CONFIG_KEYS = ['defaultCurrency'];

  private db: PgliteDrizzle | undefined;

  private isInitialized = false;
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
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      console.log('Database is initializing. Please wait...');
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = this.initialize();
    await this.initializationPromise;
    this.initializationPromise = null;
  }

  private async initialize() {
    const latestVersion = await this.getLatestVersion();

    if (!(await this.validateSchemaVersion(latestVersion.schema))) {
      await this.updateSchema();
    }

    if (!(await this.validateDataset(latestVersion.dataset))) {
      await this.updateDataset();
    }

    const missingDefaultConfigKeys = await this.getMissingDefaultConfig();
    if (missingDefaultConfigKeys.length > 0) {
      await this.insertDefaultConfig(missingDefaultConfigKeys);
    }

    const demoService = new DemoService(this.db!);
    await demoService.initializeDemoData();

    this.isInitialized = true;
  }

  private async getLatestVersion(): Promise<Version> {
    return await (await fetch('/api/get-latest-version', { method: 'GET' })).json();
  }

  private async validateSchemaVersion(schemaVersion: string) {
    try {
      const localSchemaVersion = await this.db?.query.information.findFirst({
        where: eq(schema.information.name, 'schemaVersion'),
      });

      return localSchemaVersion?.value === schemaVersion;
    } catch {
      return false;
    }
  }

  private async updateSchema() {
    // Create schemas and tables to the IndexedDb
    const fetched = await (await fetch('/api/get-schema-data', { method: 'GET' })).json();
    await this.db?.$client.exec(fetched.sql);
    await this.db
      ?.insert(schema.information)
      .values({ name: 'schemaVersion', value: fetched.version })
      .onConflictDoUpdate({
        target: schema.information.name,
        set: { value: fetched.version },
      });
    console.log('updateSchema() completed.');
  }

  private async validateDataset(datasetVersion: string) {
    const localDatasetVersion = await this.db?.query.information.findFirst({
      where: eq(schema.information.name, 'datasetVersion'),
    });

    return localDatasetVersion?.value === datasetVersion;
  }

  private async updateDataset() {
    // Insert foundation data
    await Promise.all([
      this.db?.insert(schema.currencies).values(DATASET_CURRENCY_FIAT).onConflictDoNothing(),
      this.db?.insert(schema.countries).values(DATASET_COUNTRY).onConflictDoNothing(),
    ]);

    await this.db
      ?.insert(schema.information)
      .values({ name: 'datasetVersion', value: '0.0.1' })
      .onConflictDoUpdate({
        target: schema.information.name,
        set: { value: '0.0.1' },
      });

    console.log('updateDataset completed.');
  }

  private async getMissingDefaultConfig() {
    const storedKeys = (
      await this.db
        ?.select({
          key: schema.information.name,
        })
        .from(schema.information)
    )?.map((e) => e.key);

    return DBInitializer.DEFAULT_CONFIG_KEYS.filter((key) => !storedKeys?.includes(key));
  }

  private async insertDefaultConfig(missingKeys: typeof DBInitializer.DEFAULT_CONFIG_KEYS) {
    missingKeys.forEach(async (key) => {
      switch (key) {
        case 'defaultCurrency': {
          const countryCodeAlpha2 = navigator.languages.at(0)?.substring(3, 5) ?? 'US';
          const country = await this.db?.query.countries.findFirst({
            where: eq(schema.countries.codeAlpha2, countryCodeAlpha2),
            with: { defaultCurrency: true },
          });
          await this.db
            ?.insert(schema.information)
            .values({ name: 'defaultCurrency', value: country?.defaultCurrency?.code ?? 'USD' })
            .onConflictDoNothing();
        }
      }
    });
  }
}
