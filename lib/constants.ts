export const LOCAL_STORAGE_KEYS = {
  PGLITE: {
    SCHEMA_VERSION: 'pglite.schemaVersion',
    DATASET_VERSION: 'pglite.datasetVersion',
    SYNC_TIMESTAMP: 'pglite.syncTimestamp',
  },
  APP: {
    DEFAULT_CURRENCY: 'app.defaultCurrency',
    DEFAULT_COUNTRY: 'app.defaultCountry',
    DEFAULT_LANGUAGE: 'app.defaultLanguage',
    INITIALIZED: 'app.initialized',
    DARK_MODE: 'app.darkMode',
    SYNC_ENABLED: 'app.syncEnabled',
  },
} as const;

export const EXTERNAL_DATABASE_URL = process.env.EXTERNAL_DATABASE_URL;

export const HAS_EXTERNAL_DB = !!EXTERNAL_DATABASE_URL;

export const OPERATION_LOG_VERSION = '1.0.0';

export const PASSKEY_PRF_SALT_FIRST = 'don3-passkey-reg-prf-salt-first' as const;

export const DECORATOR_NAME_KEY = 'decoratorName' as const;
export const DECORATOR_NAME_KEY_SYMBOL = Symbol(DECORATOR_NAME_KEY);
export const DECORATOR_NAME_WRITE_OPERATION_LOG = 'writeOperationLog' as const;
