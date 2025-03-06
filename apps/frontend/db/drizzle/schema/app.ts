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
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { countries, currencies } from './config';

export const appSchema = pgSchema('app');

export const debitCreditEnum = pgEnum('debit_credit_enum', ['debit', 'credit']);
export const accounts = appSchema.table(
  'accounts',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    name: varchar({ length: 255 }).notNull(),
    type: debitCreditEnum().notNull(),
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
  },
  (t) => [
    index('accounts_idx_type').on(t.type),
    index('accounts_idx_country_id').on(t.countryId),
    index('accounts_idx_account_group_id').on(t.accountGroupId),
  ],
);
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
  'income',
  'expense',
  'uncategorized',
]);
export const accountGroups = appSchema.table(
  'account_groups',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    parentGroupId: integer()
      .default(1)
      .references((): AnyPgColumn => accountGroups.id, { onDelete: 'set default' }),
    type: accountGroupTypeEnum().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    sortOrder: integer().notNull().default(0),
    isHidden: boolean().notNull().default(false),
  },
  (t) => [
    index('account_groups_idx_parent_group_id').on(t.parentGroupId),
    index('account_groups_idx_type').on(t.type),
  ],
);
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

export const journalEntryTypeEnum = pgEnum('journal_entry_type', ['income', 'expense', 'transfer']);
export const journalEntries = appSchema.table(
  'journal_entries',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    date: timestamp({ withTimezone: true }).notNull(),
    type: journalEntryTypeEnum().notNull(),
    currencyId: integer()
      .notNull()
      .references(() => currencies.id),
    amount: numeric({ precision: 15, scale: 2 }).notNull(),
    title: varchar({ length: 255 }),
    description: text(),
    createAt: timestamp({ withTimezone: true }).defaultNow(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('journal_entries_idx_type').on(t.type),
    index('journal_entries_idx_date').on(t.date),
  ],
);
export const journalEntriesRelations = relations(journalEntries, ({ many, one }) => ({
  transactions: many(transactions),
  fxRate: one(journalEntryFxRates, {
    fields: [journalEntries.id],
    references: [journalEntryFxRates.journalEntryId],
  }),
  currency: one(currencies, {
    fields: [journalEntries.currencyId],
    references: [currencies.id],
  }),
}));

export const journalEntryFxRates = appSchema.table(
  'journal_entry_fx_rates',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    journalEntryId: integer()
      .notNull()
      .references(() => journalEntries.id),
    baseCurrencyId: integer()
      .notNull()
      .references(() => currencies.id),
    targetCurrencyId: integer()
      .notNull()
      .references(() => currencies.id),
    rate: numeric({ scale: 8 }).notNull(),
    createAt: timestamp({ withTimezone: true }).defaultNow(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('journal_entry_fx_rates_idx_create_at_base_currency_id_target_currency_id').on(
      t.createAt,
      t.baseCurrencyId,
      t.targetCurrencyId,
    ),
    unique('journal_entry_fx_rates_unq_entry_base_target').on(
      t.journalEntryId,
      t.baseCurrencyId,
      t.targetCurrencyId,
    ),
  ],
);
export const journalEntryFxRatesRelations = relations(journalEntryFxRates, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryFxRates.journalEntryId],
    references: [journalEntries.id],
  }),
  baseCurrency: one(currencies, {
    fields: [journalEntryFxRates.baseCurrencyId],
    references: [currencies.id],
  }),
  targetCurrency: one(currencies, {
    fields: [journalEntryFxRates.targetCurrencyId],
    references: [currencies.id],
  }),
}));

export const transactions = appSchema.table(
  'transactions',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity().notNull(),
    type: debitCreditEnum().notNull(),
    journalEntryId: integer()
      .notNull()
      .references(() => journalEntries.id), // TODO: Add onDelete, onUpdate policy
    accountId: integer()
      .notNull()
      .references(() => accounts.id), // TODO: Add onDelete, onUpdate policy
    amount: numeric({ precision: 15, scale: 2 }).notNull(),
    description: text(),
    createAt: timestamp({ withTimezone: true }).defaultNow(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('transactions_idx_journal_entry_id').on(t.journalEntryId),
    index('transactions_idx_account_id').on(t.accountId),
  ],
);
export const transactionsRelations = relations(transactions, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [transactions.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

// export const users = appSchema.table('users', {
//   id: uuid().primaryKey().defaultRandom(),
//   createAt: timestamp({ withTimezone: true }).defaultNow(),
//   updateAt: timestamp({ withTimezone: true }),
// });
