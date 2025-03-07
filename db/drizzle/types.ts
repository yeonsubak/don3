import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgliteTransaction as _PgliteTransaction } from 'drizzle-orm/pglite';
import * as schema from './schema';

type Schema = ExtractTablesWithRelations<typeof schema>;

export type RelationConfig<TableName extends keyof Schema> = DBQueryConfig<
  'one' | 'many',
  boolean,
  Schema,
  Schema[TableName]
>['with'] & {
  [Key in keyof Schema[TableName]['relations']]?: RelationConfig<keyof Schema>;
};

export type TableWithRelations<
  TableName extends keyof Schema,
  Relations extends RelationConfig<TableName> | undefined = undefined,
> = BuildQueryResult<Schema, Schema[TableName], { with: Relations }>;

export type CountryInsert = typeof schema.countries.$inferInsert;
export type CountrySelect = typeof schema.countries.$inferSelect;
export type CountrySelectRelations = TableWithRelations<'countries', { defaultCurrency: true }>;

export type CurrencyInsert = typeof schema.currencies.$inferInsert;
export type CurrencySelect = typeof schema.currencies.$inferSelect;

export type AccountType = (typeof schema.debitCreditEnum.enumValues)[number];
export type AccountInsert = typeof schema.accounts.$inferInsert;
export type AccountSelect = typeof schema.accounts.$inferSelect;
export type AccountSelectRelations<
  Relations extends RelationConfig<'accounts'> | undefined = undefined,
> = TableWithRelations<'accounts', Relations>;

export type AccountGroupType = (typeof schema.accountGroupTypeEnum.enumValues)[number];
export type AccountGroupInsert = typeof schema.accountGroups.$inferInsert;
export type AccountGroupSelect = typeof schema.accountGroups.$inferSelect;
export type AccountGroupSelectRelations<
  Relations extends RelationConfig<'accountGroups'> | undefined = undefined,
> = TableWithRelations<'accountGroups', Relations>;

export type JournalEntryType = (typeof schema.journalEntryTypeEnum.enumValues)[number];
export type JournalEntryTypeArray = (typeof schema.journalEntryTypeEnum.enumValues)[number][];
export type JournalEntryInsert = typeof schema.journalEntries.$inferInsert;
export type JournalEntrySelect = typeof schema.journalEntries.$inferSelect;
export type JournalEntrySelectWithRelations = TableWithRelations<
  'journalEntries',
  { fxRate: true; currency: true; transactions: true }
>;

export type JournalEntryFxRatesInsert = typeof schema.journalEntryFxRates.$inferInsert;
export type JournalEntryFxRatesSelect = typeof schema.journalEntryFxRates.$inferSelect;

export type TransactionInsert = typeof schema.transactions.$inferInsert;
export type TransactionSelect = typeof schema.transactions.$inferSelect;

export type PgliteTransaction = _PgliteTransaction<typeof schema, Schema>;

export type ForexInsert = typeof schema.forex.$inferInsert;
export type ForexSelect = typeof schema.forex.$inferSelect;
