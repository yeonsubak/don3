import type { DumpMetaData } from '@/services/backup-service';
import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  jsonb,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { generateRandomUUID } from '../db-helper';

export const syncSchema = pgSchema('sync');

export const encryptKeyRegistryTypeEnum = pgEnum('encrypt_key_registry_type_enum', [
  'symmetric',
  'asymmetric',
]);
export const encryptKeyRegistry = syncSchema.table('encrypt_key_registry', {
  id: uuid().primaryKey().default(generateRandomUUID).notNull(),
  type: encryptKeyRegistryTypeEnum().notNull(),
  userId: text().notNull(),
  credentialId: varchar({ length: 255 }).notNull(),
  createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updateAt: timestamp({ withTimezone: true }),
});
export const encryptKeyRegistryRelations = relations(encryptKeyRegistry, ({ many }) => ({
  encryptKeys: many(encryptKeys),
}));

export const encryptKeyTypeEnum = pgEnum('encrypt_key_type_enum', ['single', 'private', 'public']);
export const algorithmEnum = pgEnum('algorithm_enum', ['AES-GCM', 'AES-KW', 'RSA']);
export const encryptKeys = syncSchema.table('encrypt_keys', {
  id: uuid().primaryKey().default(generateRandomUUID).notNull(),
  registryId: uuid()
    .references(() => encryptKeyRegistry.id, { onUpdate: 'cascade', onDelete: 'cascade' })
    .notNull(),
  type: encryptKeyTypeEnum().notNull(),
  algorithm: algorithmEnum().notNull(),
  key: text().notNull(),
  isKeyWrapped: boolean().notNull(),
  createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updateAt: timestamp({ withTimezone: true }),
});
export const encryptKeysRelations = relations(encryptKeys, ({ one }) => ({
  keyRegistry: one(encryptKeyRegistry, {
    fields: [encryptKeys.registryId],
    references: [encryptKeyRegistry.id],
  }),
}));

export const tempKeyStore = syncSchema.table(
  'tempKeyStore',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    serializedKey: text().notNull(),
    expireAt: timestamp({ withTimezone: true }).notNull(),
    createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [index('temp_key_store_idx_expire_at').on(t.expireAt.desc())],
);

export const operationLogs = syncSchema.table(
  'operation_logs',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    version: varchar({ length: 255 }).notNull(),
    schemaVersion: varchar({ length: 255 }).notNull(),
    deviceId: uuid().notNull(),
    sequence: bigint({ mode: 'bigint' }).notNull(),
    method: varchar({ length: 255 }).notNull(),
    methodHash: text().notNull(),
    opData: jsonb().notNull(),
    createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [unique('operation_log_unq_device_id_sequence').on(t.deviceId, t.sequence)],
);
export const operationLogsRelations = relations(operationLogs, ({ one }) => ({
  syncStatus: one(operationLogSyncStatus, {
    fields: [operationLogs.id],
    references: [operationLogSyncStatus.logId],
  }),
}));

export const operationLogSyncStatus = syncSchema.table('operation_log_sync_status', {
  id: uuid().primaryKey().default(generateRandomUUID).notNull(),
  logId: uuid()
    .references(() => operationLogs.id, { onUpdate: 'cascade', onDelete: 'no action' })
    .notNull(),
  isUploaded: boolean().notNull().default(false),
  uploadAt: timestamp({ withTimezone: true }),
  createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updateAt: timestamp({ withTimezone: true }),
});
export const operationLogSyncStatusRelations = relations(operationLogSyncStatus, ({ one }) => ({
  syncStatus: one(operationLogs, {
    fields: [operationLogSyncStatus.logId],
    references: [operationLogs.id],
  }),
}));

export const snapshotTypeEnum = pgEnum('snapshot_type_enum', ['autosave', 'user']);
export const snapshots = syncSchema.table('snapshots', {
  id: uuid().primaryKey().default(generateRandomUUID).notNull(),
  type: snapshotTypeEnum().notNull(),
  meta: jsonb().$type<DumpMetaData>().notNull(),
  dump: text().notNull(),
  createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updateAt: timestamp({ withTimezone: true }),
});
export const snapshotsRelations = relations(snapshots, ({ one }) => ({
  syncStatus: one(snapshotSyncStatus, {
    fields: [snapshots.id],
    references: [snapshotSyncStatus.snapshotId],
  }),
}));

export const snapshotSyncStatus = syncSchema.table('snapshot_sync_status', {
  id: uuid().primaryKey().default(generateRandomUUID).notNull(),
  snapshotId: uuid()
    .references(() => snapshots.id, { onUpdate: 'cascade', onDelete: 'no action' })
    .notNull(),
  isUploaded: boolean().notNull().default(false),
  uploadAt: timestamp({ withTimezone: true }),
  createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updateAt: timestamp({ withTimezone: true }),
});
export const snapshotSyncStatusRelations = relations(snapshotSyncStatus, ({ one }) => ({
  snapshot: one(snapshots, {
    fields: [snapshotSyncStatus.snapshotId],
    references: [snapshots.id],
  }),
}));

export const configSchema = pgSchema('config');

export const information = configSchema.table(
  'information',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    name: varchar({ length: 255 }).notNull(),
    value: varchar({ length: 255 }).notNull(),
  },
  (t) => [
    index('information_idx_name_value').on(t.name, t.value),
    unique('information_unq_name').on(t.name),
  ],
);
