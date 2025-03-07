import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgliteTransaction as _PgliteTransaction } from 'drizzle-orm/pglite';
import * as schema from './schema';

type Schema = ExtractTablesWithRelations<typeof schema>;
type RelationConfig<TableName extends keyof Schema> = DBQueryConfig<
  'one' | 'many',
  boolean,
  Schema,
  Schema[TableName]
>['with'] & {
  [Key in keyof Schema[TableName]['relations']]?: RelationConfig<keyof Schema>;
};
type Relation<TableName extends keyof Schema> = RelationConfig<TableName> | undefined;

export type TableWithRelation<
  TableName extends keyof Schema,
  R extends Relation<TableName> = undefined,
> = BuildQueryResult<Schema, Schema[TableName], { with: R }>;

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

export type AccountGroupType = (typeof schema.accountGroupTypeEnum.enumValues)[number];
export type AccountGroupInsert = typeof schema.accountGroups.$inferInsert;
export type AccountGroupSelect<R extends Relation<'accountGroups'> = undefined> = TableWithRelation<
  'accountGroups',
  R
>;

export type JournalEntryType = (typeof schema.journalEntryTypeEnum.enumValues)[number];
export type JournalEntryTypeArray = (typeof schema.journalEntryTypeEnum.enumValues)[number][];
export type JournalEntryInsert = typeof schema.journalEntries.$inferInsert;
export type JournalEntrySelect<R extends Relation<'journalEntries'> = undefined> =
  TableWithRelation<'journalEntries', R>;

export type JournalEntrySelect = TableWithRelation<
  'journalEntries',
  { fxRate: true; currency: true; transactions: true }
>;

export type JournalEntryFxRatesInsert<R extends Relation<'countries'> = undefined> =
  typeof schema.journalEntryFxRates.$inferInsert;
export type JournalEntryFxRatesSelect = typeof schema.journalEntryFxRates.$inferSelect;

export type TransactionInsert<R extends Relation<'countries'> = undefined> =
  typeof schema.transactions.$inferInsert;
export type TransactionSelect = typeof schema.transactions.$inferSelect;

export type PgliteTransaction = _PgliteTransaction<typeof schema, Schema>;

export type ForexInsert = typeof schema.forex.$inferInsert;
export type ForexSelect<R extends Relation<'countries'> = undefined> =
  typeof schema.forex.$inferSelect;
