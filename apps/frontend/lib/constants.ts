export const LOCAL_STORAGE_KEYS = {
  APP: {
    SCHEMA_VERSION: 'app.schemaVersion',
    DATASET_VERSION: 'app.datasetVersion',
    SYNC_TIMESTAMP: 'app.syncTimestamp',
    DEFAULT_CURRENCY: 'app.defaultCurrency',
    DEFAULT_COUNTRY: 'app.defaultCountry',
    DEFAULT_LANGUAGE: 'app.defaultLanguage',
    INITIALIZED: 'app.initialized',
    DARK_MODE: 'app.darkMode',
    SYNC_ENABLED: 'app.syncEnabled',
    USER_ID: 'app.userId',
  },
  SYNC: {
    SCHEMA_VERSION: 'sync.schemaVersion',
    DATASET_VERSION: 'sync.datasetVersion',
    SYNC_TIMESTAMP: 'sync.syncTimestamp',
    INITIALIZED: 'app.initialized',
  },
} as const;

export const EXTERNAL_DATABASE_URL = process.env.EXTERNAL_DATABASE_URL;

export const HAS_EXTERNAL_DB = !!EXTERNAL_DATABASE_URL;

export const OPERATION_LOG_VERSION = '1.0.0';

export const PASSKEY_PRF_SALT_FIRST = 'don3-passkey-reg-prf-salt-first' as const;

export const DECORATOR_NAME_KEY = 'decoratorName' as const;
export const DECORATOR_NAME_KEY_SYMBOL = Symbol(DECORATOR_NAME_KEY);
export const DECORATOR_NAME_WRITE_OPERATION_LOG = 'writeOperationLog' as const;

const APP_DB_NAME_BASE = 'don3_app' as const;
const USER_ID =
  typeof localStorage !== 'undefined'
    ? localStorage.getItem(LOCAL_STORAGE_KEYS.APP.USER_ID)
    : undefined;
export const APP_DB_NAME = APP_DB_NAME_BASE + (USER_ID ? '_' + USER_ID : '');
export const APP_DB_MIGRATION_PATH = 'db/app-db/migration' as const;

export const SYNC_DB_NAME = 'don3_sync' as const;
export const SYNC_DB_MIGRATION_PATH = 'db/sync-db/migration' as const;
