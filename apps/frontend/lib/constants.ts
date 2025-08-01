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
  },
  SYNC: {
    SCHEMA_VERSION: 'sync.schemaVersion',
    DATASET_VERSION: 'sync.datasetVersion',
    SYNC_TIMESTAMP: 'sync.syncTimestamp',
    SYNC_ENABLED: 'sync.syncEnabled',
    USER_ID: 'sync.userId',
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
export const APP_DB_NAME = (userIdArg?: string) => {
  if (userIdArg) {
    return `${APP_DB_NAME_BASE}_${userIdArg}`;
  }

  const userId =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.USER_ID)
      : undefined;
  return `${APP_DB_NAME_BASE}${userId ? '_' + userId : ''}`;
};

export const APP_DB_MIGRATION_PATH = 'db/app-db/migration' as const;

export const SYNC_DB_NAME = 'don3_sync' as const;
export const SYNC_DB_MIGRATION_PATH = 'db/sync-db/migration' as const;

export const TRUSTED_ORIGIN_BASE = process.env.BETTER_AUTH_TRUSTED_ORIGIN ?? '';
export const TRUSTED_ORIGIN_HTTPS = `https://${TRUSTED_ORIGIN_BASE}`;
export const TRUSTED_ORIGIN_HTTPS_WWW = `https://www.${TRUSTED_ORIGIN_BASE}`;

export const SYNC_SERVER_URL = process.env.SYNC_SERVER_URL;

export const SYNC_WEBSOCKET_URL = process.env.NEXT_PUBLIC_SYNC_WEBSOCKET_URL;

export const RP_ID = process.env.RP_ID;
