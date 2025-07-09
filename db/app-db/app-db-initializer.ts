import { getSchemaDefinition } from '@/app/server/db';
import type { UserConfigKey } from '@/db/app-db/schema';
import * as schema from '@/db/app-db/schema';
import { APP_SCHEMA_VERSION, LATEST_CLEAN_VERSION } from '@/db/app-db/version-table';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { BackupService } from '@/services/backup-service';
import { getSyncService } from '@/services/service-helpers';
import { SyncService } from '@/services/sync-service';
import { IdbFs as IdbFs02, PGlite as PGlite02 } from '@electric-sql/pglite-02';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { appDrizzle, type AppDrizzle } from '..';
import { DATASET_ACCOUNT_GROUPS } from '../dataset/account-groups';
import { DATASET_ACCOUNTS } from '../dataset/accounts';
import { DATASET_COUNTRY } from '../dataset/country';
import { DATASET_CURRENCY_FIAT } from '../dataset/currency';
import { getLatestSchemaVersion } from '../db-helper';
import { DBInitializer } from '../db-initializer';
import { PGliteAppWorker } from '../pglite/pglite-app-worker';

export class AppDBInitializer extends DBInitializer {
  protected static instance: AppDBInitializer | null = null;
  declare protected db: AppDrizzle;
  declare protected pg: PGliteAppWorker;
  private defaultCountry!: string;
  private defaultCurrency!: string;
  private syncService: SyncService | null = null;

  public static async getInstance(): Promise<AppDBInitializer> {
    if (!AppDBInitializer.instance) {
      AppDBInitializer.instance = new AppDBInitializer();
      const pg = await PGliteAppWorker.getInstance();
      const db = appDrizzle(pg);
      AppDBInitializer.instance.pg = pg;
      AppDBInitializer.instance.db = db;
      AppDBInitializer.instance.defaultCountry =
        localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY) ?? 'USA';
      AppDBInitializer.instance.defaultCurrency =
        localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY) ?? 'USD';
    }

    return AppDBInitializer.instance;
  }

  public async initialize() {
    if (!(await this.validateSchemaVersion())) {
      await this.syncSchema();
    }

    if (!(await this.validateDataset())) {
      await this.syncDataset();
    }

    const missingConfigKeys = await this.getMissingConfig([...schema.USER_CONFIG_KEYS]);
    if (missingConfigKeys.length > 0) {
      await this.insertMissingConfig(missingConfigKeys);
    }

    if (!(await this.hasAccounts())) {
      await this.insertPresetData();
    }

    this.clearUnusedLocalStorageValues();

    if (!(await this.hasSnapshot())) {
      await this.createFirstSnapshot();
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SYNC_TIMESTAMP, `${Date.now()}`);
    this.isInitialized = true;
  }

  protected async validateSchemaVersion() {
    const latestVersion = getLatestSchemaVersion(APP_SCHEMA_VERSION);
    const localStorageVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);

    if (localStorageVersion) {
      return localStorageVersion === latestVersion;
    }

    const isDBReady = await this.isDBReady();
    if (!isDBReady) {
      return false;
    }

    const dbVersion = await this.getDBVersion();
    if (dbVersion) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION, dbVersion);
    }

    return dbVersion === latestVersion;
  }

  protected async syncSchema() {
    const currentVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);
    const nextVersion = currentVersion
      ? APP_SCHEMA_VERSION[currentVersion]?.nextVersion
      : LATEST_CLEAN_VERSION.version;
    const latestVersion = getLatestSchemaVersion(APP_SCHEMA_VERSION);

    const updateSchema = async (nextVersion: string | undefined | null): Promise<void> => {
      if (!nextVersion) return;

      const currentVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);
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

      localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION, storedVersion);

      console.log(`Synchronized app db to ${storedVersion}`);

      await updateSchema(version.nextVersion);
    };

    await updateSchema(nextVersion);
  }

  private async validateDataset() {
    const latestVersion = '0.0.1';
    const localStorageVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DATASET_VERSION);

    if (localStorageVersion) {
      return localStorageVersion === latestVersion;
    }

    const dbVersion = (
      await this.db.query.information.findFirst({
        where: ({ name }, { eq }) => eq(name, 'datasetVersion'),
      })
    )?.value;

    if (dbVersion) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION, dbVersion);
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

    localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DATASET_VERSION, version);
    console.log(
      `Synchronized the local dataset to ${localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DATASET_VERSION)}`,
    );
  }

  protected async insertMissingConfig(missingKeys: UserConfigKey[]): Promise<void> {
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

  private async hasSnapshot() {
    const isInitialized = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.INITIALIZED);
    if (isInitialized === 'true') {
      return true;
    }

    if (!this.syncService) {
      this.syncService = await getSyncService();
    }

    return this.syncService.hasSnapshot();
  }

  private async createFirstSnapshot() {
    const backupService = new BackupService({ db: this.db });

    if (!this.syncService) {
      this.syncService = await getSyncService();
    }

    const { dump, metaData } = await backupService.createBackup();

    const deviceId = await this.syncService.getUserConfig('deviceId');
    if (!deviceId) throw new Error('deviceId is undefined in local storage');

    await this.syncService.insertSnapshot(
      {
        type: 'autosave',
        schemaVersion: metaData.schemaVersion,
        meta: metaData,
        deviceId: deviceId.value,
        dump,
      },
      'idle',
    );
  }

  private async isDBReady() {
    try {
      const cnt = await this.db.$count(schema.information);
      return cnt > 0;
    } catch (err) {
      return false;
    }
  }

  private async getDBVersion() {
    try {
      const res = await this.db.query.information.findFirst({
        where: ({ name }, { eq }) => eq(name, 'schemaVersion'),
      });

      return res?.value;
    } catch (err) {
      console.error(err);
    }
  }
}
