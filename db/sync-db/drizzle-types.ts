import * as syncSchema from './schema';

export type SyncSchema = typeof syncSchema;

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
