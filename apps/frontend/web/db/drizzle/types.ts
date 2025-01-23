import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgTransaction as _PgTransaction } from 'drizzle-orm/pg-core';
import type { PgliteQueryResultHKT } from 'drizzle-orm/pglite';
import * as schema from './schema';

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

export type TransactionInsert = typeof schema.transactions.$inferInsert;
export type TransactionSelect = typeof schema.transactions.$inferSelect;

export type AccountGroupType = (typeof schema.accountGroupTypeEnum.enumValues)[number];

export type PgTransaction = _PgTransaction<
  PgliteQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
