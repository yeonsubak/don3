import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgliteTransaction as _PgliteTransaction } from 'drizzle-orm/pglite';
import * as schema from './schema';

export type SchemaExtracted<TSchema extends Record<string, unknown>> =
  ExtractTablesWithRelations<TSchema>;

export type PgliteTransaction<
  TSchema extends Record<string, unknown>,
  TSchemaExtracted extends ExtractTablesWithRelations<TSchema>,
> = _PgliteTransaction<TSchema, TSchemaExtracted>;

export type AppSchema = typeof schema;
type AppSchemaExtracted = ExtractTablesWithRelations<AppSchema>;

type AppRelationConfig<TableName extends keyof AppSchemaExtracted> = DBQueryConfig<
  'one' | 'many',
  boolean,
  AppSchemaExtracted,
  AppSchemaExtracted[TableName]
>['with'] & {
  [Key in keyof AppSchemaExtracted[TableName]['relations']]?: AppRelationConfig<
    keyof AppSchemaExtracted
  >;
};
type Relation<TableName extends keyof AppSchemaExtracted> =
  | AppRelationConfig<TableName>
  | undefined;
type TableWithRelation<
  TableName extends keyof AppSchemaExtracted,
  R extends Relation<TableName> = undefined,
> = BuildQueryResult<AppSchemaExtracted, AppSchemaExtracted[TableName], { with: R }>;

export type CountryInsert = typeof schema.countries.$inferInsert;
export type CountrySelect<R extends Relation<'countries'> = undefined> = TableWithRelation<
  'countries',
  R
>;

export type CurrencyInsert = typeof schema.currencies.$inferInsert;
export type CurrencySelect<R extends Relation<'currencies'> = undefined> = TableWithRelation<
  'currencies',
  R
>;

export type AccountType = (typeof schema.debitCreditEnum.enumValues)[number];
export type AccountInsert = typeof schema.accounts.$inferInsert;
export type AccountSelect<R extends Relation<'accounts'> = undefined> = TableWithRelation<
  'accounts',
  R
>;
export type AccountSelectAll = AccountSelect<{
  country: true;
  currency: true;
  group: true;
  balance: true;
}>;
export type AccountSelectAllTx = AccountSelect<{
  country: true;
  currency: true;
  group: true;
  balance: true;
  transactions: true;
}>;

export type AccountBalanceSelect = typeof schema.assetLiabilityBalances.$inferSelect;
export type AccountBalanceInsert = typeof schema.assetLiabilityBalances.$inferInsert;

export type AccountGroupType = (typeof schema.accountGroupTypeEnum.enumValues)[number];
export type AccountGroupInsert = typeof schema.accountGroups.$inferInsert;
export type AccountGroupSelect<R extends Relation<'accountGroups'> = undefined> = TableWithRelation<
  'accountGroups',
  R
>;
export type AccountGroupSelectAll = AccountGroupSelect<{
  accounts: AccountSelectAll;
  childGroups: true;
}>;

export type JournalEntryType = (typeof schema.journalEntryTypeEnum.enumValues)[number];
export type JournalEntryInsert = typeof schema.journalEntries.$inferInsert;
export type JournalEntrySelect<R extends Relation<'journalEntries'> = undefined> =
  TableWithRelation<'journalEntries', R>;

export type JournalEntryFxRatesInsert = typeof schema.journalEntryFxRates.$inferInsert;
export type JournalEntryFxRatesSelect<R extends Relation<'journalEntryFxRates'> = undefined> =
  TableWithRelation<'journalEntryFxRates', R>;

export type TransactionInsert = typeof schema.transactions.$inferInsert;
export type TransactionSelect<R extends Relation<'transactions'> = undefined> = TableWithRelation<
  'transactions',
  R
>;

export type InformationInsert = typeof schema.information.$inferInsert;
export type InformationSelect = typeof schema.information.$inferSelect;

export type ForexInsert = typeof schema.forex.$inferInsert;
export type ForexSelect<R extends Relation<'forex'> = undefined> = TableWithRelation<'forex', R>;
