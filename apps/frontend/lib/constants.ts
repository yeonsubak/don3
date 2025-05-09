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
  },
} as const;
