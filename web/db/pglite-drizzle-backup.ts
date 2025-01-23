import type { Version } from '@/app/api/get-latest-version/route';
import { PGlite } from '@electric-sql/pglite';
import { eq, sql } from 'drizzle-orm';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { DATASET_COUNTRY } from './dataset/country';
import { DATASET_CURRENCY_FIAT } from './dataset/currency';
import { DATASET_DEFAULT_CURRENCY_LOOKUP } from './dataset/default-currency-lookup';
import * as schema from './drizzle/schema';
import { PgliteClient } from './pglite-client';

export type PgliteDrizzleClient = PgliteDatabase<typeof schema> & {
  $client: PGlite;
};

export class PgliteDrizzle {
  private static instance: PgliteDrizzle;
  private db: PgliteDrizzleClient | undefined;

  private isDbReady = false;
  private isDbOnInit = false; // To track if the initialization is in progress
  private getDbQueue: (() => Promise<void>)[] = [];

  private constructor() {}

  public static async getInstance(): Promise<PgliteDrizzle> {
    if (!PgliteDrizzle.instance) {
      const pgliteClient = PgliteClient.getInstance()!;
      const db: PgliteDrizzleClient = drizzle(pgliteClient, {
        schema,
        casing: 'snake_case',
      });

      // await PgliteDrizzle.initialize(db);
      PgliteDrizzle.instance = new PgliteDrizzle();
      PgliteDrizzle.instance.db = db;
    }

    return PgliteDrizzle.instance;
  }

  public async getDb(): Promise<PgliteDrizzleClient | undefined> {
    if (this.isDbReady) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      this.getDbQueue.push(async () => {
        try {
          resolve(this.db);
        } catch (err) {
          reject(err);
        }
      });

      this.initialize();
    });
  }

  public async initialize() {
    const executeInit = async () => {
      const latestVersion = await this.getLatestVersion();

      if (!(await this.validateSchemaVersion(latestVersion.schema))) {
        await this.updateSchema();
      }

      if (!(await this.validateDataset(latestVersion.dataset))) {
        await this.updateDataset();
      }

      this.isDbReady = true;
    };

    if (this.isDbOnInit) return; // Avoid running multiple initializations simultaneously
    this.isDbOnInit = true;

    try {
      await executeInit();
    } catch (err) {
      console.log('Failed to initialize the database: ', err);
    } finally {
      this.isDbOnInit = false;

      while (this.getDbQueue.length > 0) {
        const task = this.getDbQueue.shift();
        task?.();
      }
    }
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
      this.db
        ?.insert(schema.defaultCurrencyLookup)
        .values(DATASET_DEFAULT_CURRENCY_LOOKUP)
        .onConflictDoNothing(),
    ]);

    const defaultCurrencyLookup = await this.db?.query.defaultCurrencyLookup.findMany();
    if (!defaultCurrencyLookup) {
      throw new Error('defaultCurrencyLookup is undefined.');
    }

    const setDefaultCurrency = defaultCurrencyLookup.map(async ({ countryCode, currencyCode }) => {
      const currency = (
        await this.db
          ?.select()
          .from(schema.currencies)
          .where(eq(schema.currencies.code, currencyCode))
      )?.at(0);
      if (currency) {
        await this.db
          ?.update(schema.countries)
          .set({ defaultCurrencyId: currency.id, updateAt: sql`NOW()` })
          .where(eq(schema.countries.code, countryCode))
          .returning();
      }
    });
    await Promise.all(setDefaultCurrency);

    await this.db
      ?.insert(schema.information)
      .values({ name: 'datasetVersion', value: '0.0.1' })
      .onConflictDoUpdate({
        target: schema.information.name,
        set: { value: '0.0.1' },
      });

    console.log('updateDataset() completed.');
  }
}
