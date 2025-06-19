import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgPolicy,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const forex = pgTable(
  'forex',
  {
    date: date().notNull(),
    baseCurrency: varchar('base_currency').notNull(),
    targetCurrency: varchar('target_currency').notNull(),
    rate: numeric().notNull(),
    createAt: timestamp('create_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    id: uuid().defaultRandom().primaryKey().notNull(),
  },
  (table) => [
    pgPolicy('Enable update for users based on email', {
      as: 'permissive',
      for: 'update',
      to: ['dondondon_crud'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy('Enable read access', { as: 'permissive', for: 'select', to: ['dondondon_readonly'] }),
    pgPolicy('Enable insert', { as: 'permissive', for: 'insert', to: ['dondondon_crud'] }),
    pgPolicy('Enable delete', { as: 'permissive', for: 'delete', to: ['dondondon_crud'] }),
  ],
);

export const schemaDefinitions = pgTable(
  'schema_definitions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    version: varchar().notNull(),
    sqlContent: text('sql_content'),
    nextVersion: varchar('next_version'),
    createAt: timestamp('create_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updateAt: timestamp('update_at', { withTimezone: true, mode: 'date' }),
    requireMigration: boolean('require_migration').default(false).notNull(),
    requireDumpToUpdate: boolean('require_dump_to_update').default(false).notNull(),
  },
  (table) => [
    unique('schema_definitions_version_key').on(table.version),
    pgPolicy('Enable update', {
      as: 'permissive',
      for: 'update',
      to: ['dondondon_crud'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy('Enable read access', { as: 'permissive', for: 'select', to: ['dondondon_readonly'] }),
    pgPolicy('Enable insert', { as: 'permissive', for: 'insert', to: ['dondondon_crud'] }),
    pgPolicy('Enable delete', { as: 'permissive', for: 'delete', to: ['dondondon_crud'] }),
  ],
);

/* Auth Schema */
export const appAuthSchema = pgSchema('app_auth');

export const user = appAuthSchema.table(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified')
      .$defaultFn(() => false)
      .notNull(),
    image: text('image'),
    createdAt: timestamp('created_at')
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: timestamp('updated_at')
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [index('user_idx_email').on(t.email)],
);

export const session = appAuthSchema.table(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('session_idx_user_id_token').on(t.userId, t.token),
    index('session_idx_token').on(t.token),
  ],
);

export const account = appAuthSchema.table(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('account_idx_user_id').on(t.userId)],
);

export const verification = appAuthSchema.table(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()),
  },
  (t) => [index('verification_idx_identifier').on(t.identifier)],
);

export const passkey = appAuthSchema.table(
  'passkey',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text('credential_i_d').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text('transports'),
    createdAt: timestamp('created_at'),
    aaguid: text('aaguid'),
  },
  (t) => [index('passkey_idx_user_id').on(t.userId)],
);
export const passkeyRelations = relations(passkey, ({ many }) => ({
  wrappedKeys: many(wrappedKeys),
}));

export const algorithmEnum = pgEnum('algorithm_enum', ['AES-GCM', 'AES-KW', 'RSA']);
export const wrappedKeys = appAuthSchema.table(
  'wrapped_keys',
  {
    id: text('id').primaryKey(),
    passkeyId: text('passkey_id')
      .notNull()
      .references(() => passkey.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    wrappedKey: text('wrapped_key').notNull(),
    algorithm: algorithmEnum().notNull(),
    prfSalt: text('prf_salt').notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()),
  },
  (t) => [index('wrapped_key_idx_passkey_id').on(t.passkeyId)],
);
export const wrappedKeyRelations = relations(wrappedKeys, ({ one }) => ({
  passkey: one(passkey, {
    fields: [wrappedKeys.passkeyId],
    references: [passkey.id],
  }),
}));
