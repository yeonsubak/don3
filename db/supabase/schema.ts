import { pgTable, pgPolicy, bigint, date, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const forex = pgTable(
  'forex',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'forex_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    date: date().notNull(),
    baseCurrency: varchar('base_currency').notNull(),
    targetCurrency: varchar('target_currency').notNull(),
    rate: numeric().notNull(),
    createAt: timestamp('create_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    pgPolicy('Enable delete', {
      as: 'permissive',
      for: 'delete',
      to: ['dondondon_crud'],
      using: sql`true`,
    }),
    pgPolicy('Enable update', { as: 'permissive', for: 'update', to: ['dondondon_crud'] }),
    pgPolicy('Enable insert', { as: 'permissive', for: 'insert', to: ['dondondon_crud'] }),
    pgPolicy('Enable read access', { as: 'permissive', for: 'select', to: ['dondondon_readonly'] }),
  ],
);
