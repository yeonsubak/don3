import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

/**
 * App Schema
 */
export const appSchema = pgSchema('app');

export const accountTypeEnum = pgEnum('account_type', ['debit', 'credit']);

export const accounts = appSchema.table('accounts', {
  id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
  name: varchar({ length: 255 }).notNull(),
  type: accountTypeEnum().notNull(),
  currencyId: integer()
    .references(() => currencies.id, { onDelete: 'restrict' })
    .notNull(),
  countryId: integer()
    .references(() => countries.id, { onDelete: 'restrict' })
    .notNull(),
  accountGroupId: integer()
    .default(1)
    .references(() => accountGroups.id, { onDelete: 'set default' }),
  sortOrder: integer().notNull().default(0),
  isArchive: boolean().default(false),
  icon: varchar({ length: 20 }),
  createAt: timestamp({ withTimezone: true }).defaultNow(),
  updateAt: timestamp({ withTimezone: true }),
});

export const accountsRelations = relations(accounts, ({ one }) => ({
  group: one(accountGroups, {
    fields: [accounts.accountGroupId],
    references: [accountGroups.id],
  }),
  country: one(countries, {
    fields: [accounts.countryId],
    references: [countries.id],
  }),
  currency: one(currencies, {
    fields: [accounts.currencyId],
    references: [currencies.id],
  }),
}));

export const accountGroupTypeEnum = pgEnum('account_group_type', [
  'asset',
  'liability',
  'expense',
  'uncategorized',
]);

export const accountGroups = appSchema.table('account_groups', {
  id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
  parentGroupId: integer()
    .default(1)
    .references((): AnyPgColumn => accountGroups.id, { onDelete: 'set default' }),
  type: accountGroupTypeEnum().notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  sortOrder: integer().notNull().default(0),
  isHidden: boolean().notNull().default(false),
});

export const accountGroupsRelations = relations(accountGroups, ({ one, many }) => ({
  accounts: many(accounts),
  parentGroup: one(accountGroups, {
    fields: [accountGroups.parentGroupId],
    references: [accountGroups.id],
    relationName: 'parentChilds',
  }),
  childGroups: many(accountGroups, {
    relationName: 'parentChilds',
  }),
}));

export const journalEntries = appSchema.table('journal_entries', {
  id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
  date: timestamp({ withTimezone: true }).notNull(),
  title: varchar({ length: 255 }),
  description: text(),
  createAt: timestamp({ withTimezone: true }).defaultNow(),
  updateAt: timestamp({ withTimezone: true }),
});

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactions = appSchema.table('transactions', {
  id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
  journalEntryId: integer()
    .notNull()
    .references(() => journalEntries.id), // TODO: Add onDelete, onUpdate policy
  accountId: integer()
    .notNull()
    .references(() => accounts.id), // TODO: Add onDelete, onUpdate policy
  currencyId: integer()
    .notNull()
    .references(() => currencies.id),
  amount: numeric({ scale: 4 }).notNull(),
  description: text(),
  createAt: timestamp({ withTimezone: true }).defaultNow(),
  updateAt: timestamp({ withTimezone: true }),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [transactions.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const users = appSchema.table('users', {
  id: uuid().primaryKey().defaultRandom(),
  createAt: timestamp({ withTimezone: true }).defaultNow(),
  updateAt: timestamp({ withTimezone: true }),
});

export const countries = appSchema.table(
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
  (t) => [index('countries_idx_code_id').on(t.code, t.id)],
);

export const countriesRelations = relations(countries, ({ one }) => ({
  defaultCurrency: one(currencies, {
    fields: [countries.defaultCurrencyId],
    references: [currencies.id],
  }),
}));

export const currencyTypeEnum = pgEnum('currency_type', ['fiat', 'crypto']);

export const currencies = appSchema.table(
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

/**
 * Config Schema
 */
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
