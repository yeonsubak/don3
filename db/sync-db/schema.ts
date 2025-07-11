import type { DumpMetaData } from '@/services/backup-service';
import { relations, type Query } from 'drizzle-orm';
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

/* Sync Schema */
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
  'temp_key_store',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    serializedKey: text().notNull(),
    expireAt: timestamp({ withTimezone: true }).notNull(),
    createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [index('temp_key_store_idx_expire_at').on(t.expireAt.desc())],
);

export const syncStatusEnum = pgEnum('sync_status_enum', ['idle', 'pending', 'done']);

export const opLogs = syncSchema.table(
  'op_logs',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    version: varchar({ length: 255 }).notNull(),
    schemaVersion: varchar({ length: 255 }).notNull(),
    deviceId: uuid().notNull(),
    sequence: bigint({ mode: 'number' }).notNull(),
    data: jsonb().$type<Query>().notNull(),
    queryKeys: jsonb().$type<string[]>().notNull(),
    status: syncStatusEnum().notNull().default('idle'),
    uploadAt: timestamp({ withTimezone: true }),
    createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [unique('op_logs_unq_device_id_sequence').on(t.deviceId, t.sequence)],
);

export const snapshotTypeEnum = pgEnum('snapshot_type_enum', ['autosave', 'user']);
export const snapshots = syncSchema.table('snapshots', {
  id: uuid().primaryKey().default(generateRandomUUID).notNull(),
  type: snapshotTypeEnum().notNull(),
  schemaVersion: varchar({ length: 255 }).notNull(),
  meta: jsonb().$type<DumpMetaData>().notNull(),
  dump: text().notNull(),
  status: syncStatusEnum().notNull().default('idle'),
  uploadAt: timestamp({ withTimezone: true }),
  createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updateAt: timestamp({ withTimezone: true }),
});

export const deviceSyncSequences = syncSchema.table(
  'device_sync_sequences',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    deviceId: uuid().notNull(),
    sequence: bigint({ mode: 'number' }).notNull(),
    createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [unique('device_sync_sequences_unq_device_id').on(t.deviceId)],
);

export const snapshotSyncSequences = syncSchema.table(
  'snapshot_sync_sequences',
  {
    id: uuid().primaryKey().default(generateRandomUUID).notNull(),
    sequence: bigint({ mode: 'number' }).notNull(),
    createAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updateAt: timestamp({ withTimezone: true }),
  },
  (t) => [unique('snapshot_sync_sequences_unq_sequence').on(t.sequence)],
);

/* Config Schema */

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
