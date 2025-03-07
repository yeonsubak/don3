export const USER_CONFIG_KEYS = ['defaultCurrency', 'defaultLanguage'] as const;
export type UserConfigKey = (typeof USER_CONFIG_KEYS)[number];
