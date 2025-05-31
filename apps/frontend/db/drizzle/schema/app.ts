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
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { countries, currencies } from './config';
import { generateRandomUUID } from './helper';

export const appSchema = pgSchema('app');

export const debitCreditEnum = pgEnum('debit_credit_enum', ['debit', 'credit']);
export const accounts = appSchema.table(
  'accounts',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    name: varchar({ length: 255 }).notNull(),
    type: debitCreditEnum().notNull(),
    currencyId: uuid()
      .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'restrict' })
      .notNull(),
    countryId: uuid()
      .references(() => countries.id, { onUpdate: 'cascade', onDelete: 'restrict' })
      .notNull(),
    accountGroupId: uuid()
      .references(() => accountGroups.id, {
        onUpdate: 'cascade',
        onDelete: 'set default',
      })
      .notNull(),
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
export const accountsRelations = relations(accounts, ({ one, many }) => ({
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
  balance: one(assetLiabilityBalances, {
    fields: [accounts.id],
    references: [assetLiabilityBalances.accountId],
  }),
  transactions: many(transactions),
}));

export const assetLiabilityBalances = appSchema.table(
  'asset_liability_balances',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    accountId: uuid()
      .references(() => accounts.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    balance: numeric({ precision: 15, scale: 2, mode: 'number' }).notNull().default(0),
    createAt: timestamp({ withTimezone: true }).defaultNow(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('asset_liability_balances_idx_account_id').on(t.accountId, t.id),
    unique('asset_liability_balances_unq_account_id').on(t.accountId),
  ],
);

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
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    parentGroupId: uuid()
      .default('f3cddbaf-cd30-4846-9a92-2b6fce7aca7e')
      .references((): AnyPgColumn => accountGroups.id, {
        onUpdate: 'cascade',
        onDelete: 'set default',
      }),
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
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    date: timestamp({ withTimezone: true }).notNull(),
    type: journalEntryTypeEnum().notNull(),
    currencyId: uuid()
      .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'restrict' })
      .notNull(),
    amount: numeric({ precision: 15, scale: 2, mode: 'number' }).notNull(),
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
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    journalEntryId: uuid()
      .references(() => journalEntries.id, { onUpdate: 'cascade', onDelete: 'cascade' })
      .notNull(),
    baseCurrencyId: uuid()
      .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'restrict' })
      .notNull(),
    targetCurrencyId: uuid()
      .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'restrict' })
      .notNull(),
    rate: numeric({ scale: 8, mode: 'number' }).notNull(),
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
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    type: debitCreditEnum().notNull(),
    journalEntryId: uuid()
      .references(() => journalEntries.id, { onUpdate: 'cascade', onDelete: 'cascade' })
      .notNull(),
    accountId: uuid()
      .references(() => accounts.id, { onUpdate: 'cascade', onDelete: 'cascade' })
      .notNull(),
    amount: numeric({ precision: 15, scale: 2, mode: 'number' }).notNull(),
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
