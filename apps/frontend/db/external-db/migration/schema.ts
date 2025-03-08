import { pgTable, unique, bigint, varchar, text, timestamp, pgPolicy, date, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const schemaDefinitions = pgTable("schema_definitions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "schema_definitions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	version: varchar().notNull(),
	sqlContent: text("sql_content").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	prevId: bigint("prev_id", { mode: "number" }).notNull(),
	createAt: timestamp("create_at", { withTimezone: true, mode: 'string' }).notNull(),
	updateAt: timestamp("update_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("schema_definitions_version_key").on(table.version),
	unique("schema_definitions_prev_id_key").on(table.prevId),
]);

export const forex = pgTable("forex", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "forex_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	date: date().notNull(),
	baseCurrency: varchar("base_currency").notNull(),
	targetCurrency: varchar("target_currency").notNull(),
	rate: numeric().notNull(),
	createAt: timestamp("create_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("Enable delete", { as: "permissive", for: "delete", to: ["dondondon_crud"], using: sql`true` }),
	pgPolicy("Enable update", { as: "permissive", for: "update", to: ["dondondon_crud"] }),
	pgPolicy("Enable insert", { as: "permissive", for: "insert", to: ["dondondon_crud"] }),
	pgPolicy("Enable read access", { as: "permissive", for: "select", to: ["dondondon_readonly"] }),
]);
