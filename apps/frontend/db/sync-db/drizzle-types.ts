import * as syncSchema from './schema';

export const USER_CONFIG_KEYS = ['schemaVersion', 'deviceId', 'userId'] as const;
export type UserConfigKey = (typeof USER_CONFIG_KEYS)[number];

export type SyncSchema = typeof syncSchema;

export type KeyRegistryInsert = typeof syncSchema.encryptKeyRegistry.$inferInsert;
export type KeyRegistrySelect = typeof syncSchema.encryptKeyRegistry.$inferSelect;
export type KeyRegistryType = (typeof syncSchema.encryptKeyRegistryTypeEnum.enumValues)[number];

export type EncryptKeyInsert = typeof syncSchema.encryptKeys.$inferInsert;
export type EncryptKeySelect = typeof syncSchema.encryptKeys.$inferSelect;
export type EncryptKeyType = (typeof syncSchema.encryptKeyTypeEnum.enumValues)[number];
export type Algorithm = (typeof syncSchema.algorithmEnum.enumValues)[number];

export type OpLogInsert = typeof syncSchema.opLogs.$inferInsert;
export type OpLogSelect = typeof syncSchema.opLogs.$inferSelect;

export type TempKeyStoreInsert = typeof syncSchema.tempKeyStore.$inferInsert;
export type TempKeyStoreSelect = typeof syncSchema.tempKeyStore.$inferSelect;

export type SyncStatus = (typeof syncSchema.syncStatusEnum.enumValues)[number];

export type SnapshotInsert = typeof syncSchema.snapshots.$inferInsert;
export type SnapshotSelect = typeof syncSchema.snapshots.$inferSelect;
export type SnapshotType = (typeof syncSchema.snapshotTypeEnum.enumValues)[number];

export type DeviceSyncSequenceInsert = typeof syncSchema.deviceSyncSequences.$inferInsert;
export type DeviceSyncSequenceSelect = typeof syncSchema.deviceSyncSequences.$inferSelect;
