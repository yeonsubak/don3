import { pgSchema, integer, varchar, timestamp, pgEnum, unique, uuid } from 'drizzle-orm/pg-core';

/**
 * App Schema
 */
export const appSchema = pgSchema('app');

export const accountType = pgEnum('type', ['debit', 'credit']);

export const accounts = appSchema.table('accounts', {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  type: accountType(),
  currencyId: integer()
    .references(() => currencies.id)
    .notNull(),
  countryId: integer().references(() => countries.id),
  userId: uuid().references(() => users.id), // account holder
  createAt: timestamp({ withTimezone: true }).defaultNow(),
  updateAt: timestamp({ withTimezone: true }),
});

export const users = appSchema.table('users', {
  id: uuid().primaryKey().defaultRandom(),
  createAt: timestamp({ withTimezone: true }).defaultNow(),
  updateAt: timestamp({ withTimezone: true }),
});

/**
 * Config Schema
 */
export const configSchema = pgSchema('config');

export const countries = configSchema.table('countries', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 3 }).notNull().unique(), // ISO 3166-1 alpha-3
  defaultCurrencyId: integer().references(() => currencies.id),
  createAt: timestamp({ withTimezone: true }).defaultNow(),
  updateAt: timestamp({ withTimezone: true }),
});

export const currencyType = pgEnum('type', ['fiat', 'crypto']);

export const currencies = configSchema.table(
  'currencies',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    type: currencyType().notNull(),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 3 }).notNull(), // ISO 4217
    symbol: varchar({ length: 10 }).notNull(),
    symbolNative: varchar({ length: 10 }).notNull(),
    createAt: timestamp({ withTimezone: true }).defaultNow(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    {
      unique_code_type: unique().on(t.code, t.type),
    },
  ]
);

export const defaultCurrencyLookup = configSchema.table(
  'default_currency_lookup',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    countryCode: varchar({ length: 3 }).notNull(),
    currencyCode: varchar({ length: 3 }).notNull(),
  },
  (t) => [
    {
      unique_country_code: unique().on(t.countryCode),
    },
  ]
);
