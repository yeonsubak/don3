import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgliteTransaction as _PgliteTransaction } from 'drizzle-orm/pglite';
import * as appSchema from './app-db/schema';
import * as syncSchema from './sync-db/schema';

export type SchemaExtracted<TSchema extends Record<string, unknown>> =
  ExtractTablesWithRelations<TSchema>;

export type PgliteTransaction<
  TSchema extends Record<string, unknown>,
  TSchemaExtracted extends ExtractTablesWithRelations<TSchema>,
> = _PgliteTransaction<TSchema, TSchemaExtracted>;

export type AppSchema = typeof appSchema;
type AppSchemaExtracted = ExtractTablesWithRelations<AppSchema>;

export type SyncSchema = typeof syncSchema;

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

export type CountryInsert = typeof appSchema.countries.$inferInsert;
export type CountrySelect<R extends Relation<'countries'> = undefined> = TableWithRelation<
  'countries',
  R
>;

export type CurrencyInsert = typeof appSchema.currencies.$inferInsert;
export type CurrencySelect<R extends Relation<'currencies'> = undefined> = TableWithRelation<
  'currencies',
  R
>;

export type AccountType = (typeof appSchema.debitCreditEnum.enumValues)[number];
export type AccountInsert = typeof appSchema.accounts.$inferInsert;
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

export type AccountBalanceSelect = typeof appSchema.assetLiabilityBalances.$inferSelect;
export type AccountBalanceInsert = typeof appSchema.assetLiabilityBalances.$inferInsert;

export type AccountGroupType = (typeof appSchema.accountGroupTypeEnum.enumValues)[number];
export type AccountGroupInsert = typeof appSchema.accountGroups.$inferInsert;
export type AccountGroupSelect<R extends Relation<'accountGroups'> = undefined> = TableWithRelation<
  'accountGroups',
  R
>;
export type AccountGroupSelectAll = AccountGroupSelect<{
  accounts: AccountSelectAll;
  childGroups: true;
}>;

export type JournalEntryType = (typeof appSchema.journalEntryTypeEnum.enumValues)[number];
export type JournalEntryInsert = typeof appSchema.journalEntries.$inferInsert;
export type JournalEntrySelect<R extends Relation<'journalEntries'> = undefined> =
  TableWithRelation<'journalEntries', R>;

export type JournalEntryFxRatesInsert = typeof appSchema.journalEntryFxRates.$inferInsert;
export type JournalEntryFxRatesSelect<R extends Relation<'journalEntryFxRates'> = undefined> =
  TableWithRelation<'journalEntryFxRates', R>;

export type TransactionInsert = typeof appSchema.transactions.$inferInsert;
export type TransactionSelect<R extends Relation<'transactions'> = undefined> = TableWithRelation<
  'transactions',
  R
>;

export type InformationInsert = typeof appSchema.information.$inferInsert;
export type InformationSelect = typeof appSchema.information.$inferSelect;

export type ForexInsert = typeof appSchema.forex.$inferInsert;
export type ForexSelect<R extends Relation<'forex'> = undefined> = TableWithRelation<'forex', R>;

export type OperationLogInsert = typeof syncSchema.operationLogs.$inferInsert;
export type OperationLogSelect = typeof syncSchema.operationLogs.$inferSelect;

export type KeyRegistryInsert = typeof syncSchema.encryptKeyRegistry.$inferInsert;
export type KeyRegistrySelect = typeof syncSchema.encryptKeyRegistry.$inferSelect;
export type KeyRegistryType = (typeof syncSchema.encryptKeyRegistryTypeEnum.enumValues)[number];

export type EncryptKeyInsert = typeof syncSchema.encryptKeys.$inferInsert;
export type EncryptKeySelect = typeof syncSchema.encryptKeys.$inferSelect;
export type EncryptKeyType = (typeof syncSchema.encryptKeyTypeEnum.enumValues)[number];
export type Algorithm = (typeof syncSchema.algorithmEnum.enumValues)[number];

export type OperationLogSyncStatusInsert = typeof syncSchema.operationLogSyncStatus.$inferInsert;
export type OperationLogSyncStatusSelect = typeof syncSchema.operationLogSyncStatus.$inferSelect;

export type TempKeyStoreInsert = typeof syncSchema.tempKeyStore.$inferInsert;
export type TempKeyStoreSelect = typeof syncSchema.tempKeyStore.$inferSelect;

export type SnapshotInsert = typeof syncSchema.snapshots.$inferInsert;
export type SnapshotSelect = typeof syncSchema.snapshots.$inferSelect;
export type SnapshotType = (typeof syncSchema.snapshotTypeEnum.enumValues)[number];
