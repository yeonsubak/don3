import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgSchema,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
  date,
  numeric,
} from 'drizzle-orm/pg-core';

export const configSchema = pgSchema('config');

export const information = configSchema.table(
  'information',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    name: varchar({ length: 255 }).notNull(),
    value: varchar({ length: 255 }).notNull(),
  },
  (t) => [
    index('information_idx_name_value').on(t.name, t.value),
    unique('information_unq_name').on(t.name),
  ],
);

export const countries = configSchema.table(
  'countries',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 3 }).notNull().unique(), // ISO 3166-1 alpha-3
    codeAlpha2: varchar({ length: 2 }).notNull().unique(),
    defaultCurrencyId: integer(),
    emoji: varchar({ length: 3 }),
    createAt: timestamp({ withTimezone: true }).defaultNow(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('countries_idx_code_id').on(t.code, t.id),
    index('countries_idx_code_alpha_2_code').on(t.codeAlpha2, t.code),
  ],
);

export const countriesRelations = relations(countries, ({ one }) => ({
  defaultCurrency: one(currencies, {
    fields: [countries.defaultCurrencyId],
    references: [currencies.id],
  }),
}));

export const currencyTypeEnum = pgEnum('currency_type', ['fiat', 'crypto']);

export const currencies = configSchema.table(
  'currencies',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    type: currencyTypeEnum().notNull(),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 3 }).notNull(), // The currency code in accordance with ISO 4217
    symbol: varchar({ length: 10 }).notNull(),
    symbolNative: varchar({ length: 10 }).notNull(),
    isoDigits: integer().notNull().default(0), // The number of digits after the decimal separator in accordance with ISO 4217
    createAt: timestamp({ withTimezone: true }).defaultNow(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('currencies_idx_code_id').on(t.code, t.id),
    uniqueIndex('currencies_unq_code_type').on(t.code, t.type),
  ],
);

export const currenciesRelations = relations(currencies, ({ many }) => ({
  countriesInUse: many(countries),
}));

export const forex = configSchema.table(
  'forex',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    date: date().notNull(),
    baseCurrency: varchar('base_currency').notNull(),
    targetCurrency: varchar('target_currency').notNull(),
    rate: numeric().notNull(),
    createAt: timestamp('create_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (t) => [
    index('forex_idx_create_at_base_currency_target_currency').on(
      t.createAt,
      t.baseCurrency,
      t.targetCurrency,
    ),
  ],
);
