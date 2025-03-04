import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgliteTransaction as _PgliteTransaction } from 'drizzle-orm/pglite';
import schema from './schema';

type Schema = ExtractTablesWithRelations<typeof schema>;
export type IncludeRelation<TableName extends keyof Schema> = DBQueryConfig<
  'one' | 'many',
  boolean,
  Schema,
  Schema[TableName]
>['with'];
export type InferResultType<
  TableName extends keyof Schema,
  With extends IncludeRelation<TableName> | undefined = undefined,
> = BuildQueryResult<Schema, Schema[TableName], { with: With }>;

export type CountryInsert = typeof schema.countries.$inferInsert;
export type CountrySelect = typeof schema.countries.$inferSelect;
export type CountrySelectWithRelations = InferResultType<'countries', { defaultCurrency: true }>;

export type CurrencyInsert = typeof schema.currencies.$inferInsert;
export type CurrencySelect = typeof schema.currencies.$inferSelect;

export type AccountInsert = typeof schema.accounts.$inferInsert;
export type AccountSelect = typeof schema.accounts.$inferSelect;
export type AccountSelectWithRelations = InferResultType<
  'accounts',
  { group: true; country: true; currency: true }
>;

export type AccountGroupInsert = typeof schema.accountGroups.$inferInsert;
export type AccountGroupSelect = typeof schema.accountGroups.$inferSelect;
export type AccountGroupSelectWithRelations = InferResultType<
  'accountGroups',
  { childGroups: true }
> & {
  accounts: AccountSelectWithRelations[];
};

export type JournalEntryInsert = typeof schema.journalEntries.$inferInsert;
export type JournalEntrySelect = typeof schema.journalEntries.$inferSelect;
export type JournalEntrySelectWithRelations = InferResultType<
  'journalEntries',
  { fxRate: true; currency: true; transactions: true }
>;
export type JournalEntryType = (typeof schema.journalEntryTypeEnum.enumValues)[number];
export type JournalEntryTypeArray = (typeof schema.journalEntryTypeEnum.enumValues)[number][];

export type TransactionInsert = typeof schema.transactions.$inferInsert;
export type TransactionSelect = typeof schema.transactions.$inferSelect;

export type AccountGroupType = (typeof schema.accountGroupTypeEnum.enumValues)[number];

export type PgliteTransaction = _PgliteTransaction<typeof schema, Schema>;

export type ForexInsert = typeof schema.forex.$inferInsert;
export type ForexSelect = typeof schema.forex.$inferSelect;
