import {
  pgTable,
  pgPolicy,
  date,
  varchar,
  numeric,
  timestamp,
  uuid,
  unique,
  text,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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
