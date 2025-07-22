export * from './schema/app';
export * from './schema/config';

export const USER_CONFIG_KEYS = [
  'defaultCurrency',
  'defaultLanguage',
  'defaultCountry',
  'schemaVersion',
  'datasetVersion',
] as const;
export type UserConfigKey = (typeof USER_CONFIG_KEYS)[number];
