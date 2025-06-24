BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop outgoing foreign keys
CREATE OR REPLACE FUNCTION drop_foreign_keys(schema_name TEXT, table_name TEXT)
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE con.contype = 'f'
          AND n.nspname = schema_name
          AND c.relname = table_name
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I;',
                       schema_name, table_name, r.conname);
    END LOOP;
END;
$$ LANGUAGE plpgsql;


SELECT drop_foreign_keys('config', 'currencies');
SELECT drop_foreign_keys('config', 'countries');
SELECT drop_foreign_keys('config', 'information');
SELECT drop_foreign_keys('config', 'forex');
SELECT drop_foreign_keys('app', 'accounts');
SELECT drop_foreign_keys('app', 'account_balances');
SELECT drop_foreign_keys('app', 'account_groups');
SELECT drop_foreign_keys('app', 'journal_entries');
SELECT drop_foreign_keys('app', 'journal_entry_fx_rates');
SELECT drop_foreign_keys('app', 'transactions');

-- Create schemas to store old data
CREATE SCHEMA IF NOT EXISTS "old_app";
CREATE SCHEMA IF NOT EXISTS "old_config";

-- Move to old schema
ALTER TABLE app.accounts SET SCHEMA old_app;
ALTER TABLE app.account_balances SET SCHEMA old_app;
ALTER TABLE app.account_groups SET SCHEMA old_app;
ALTER TABLE app.journal_entries SET SCHEMA old_app;
ALTER TABLE app.journal_entry_fx_rates SET SCHEMA old_app;
ALTER TABLE app.transactions SET SCHEMA old_app;
ALTER TABLE config.countries SET SCHEMA old_config;
ALTER TABLE config.currencies SET SCHEMA old_config;
ALTER TABLE config.forex SET SCHEMA old_config;
ALTER TABLE config.information SET SCHEMA old_config;

-- Add uuid column to the old tables
ALTER TABLE old_app.accounts ADD COLUMN uuid UUID;
UPDATE old_app.accounts SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_app.accounts ALTER COLUMN uuid SET DEFAULT uuid_generate_v4();
ALTER TABLE old_app.accounts ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_app.account_balances ADD COLUMN uuid UUID;
UPDATE old_app.account_balances SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_app.account_balances ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_app.account_balances ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_app.account_groups ADD COLUMN uuid UUID;
UPDATE old_app.account_groups SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_app.account_groups ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_app.account_groups ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_app.journal_entries ADD COLUMN uuid UUID;
UPDATE old_app.journal_entries SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_app.journal_entries ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_app.journal_entries ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_app.journal_entry_fx_rates ADD COLUMN uuid UUID;
UPDATE old_app.journal_entry_fx_rates SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_app.journal_entry_fx_rates ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_app.journal_entry_fx_rates ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_app.transactions ADD COLUMN uuid UUID;
UPDATE old_app.transactions SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_app.transactions ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_app.transactions ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_config.countries ADD COLUMN uuid UUID;
UPDATE old_config.countries SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_config.countries ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_config.countries ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_config.currencies ADD COLUMN uuid UUID;
UPDATE old_config.currencies SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_config.currencies ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_config.currencies ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_config.forex ADD COLUMN uuid UUID;
UPDATE old_config.forex SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_config.forex ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_config.forex ALTER COLUMN uuid SET NOT NULL;

ALTER TABLE old_config.information ADD COLUMN uuid UUID;
UPDATE old_config.information SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
ALTER TABLE old_config.information ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(); 
ALTER TABLE old_config.information ALTER COLUMN uuid SET NOT NULL;

-- Update uuid for uncategorized at app.account_groups
UPDATE old_app.account_groups SET uuid = 'f3cddbaf-cd30-4846-9a92-2b6fce7aca7e' WHERE id = 1;

-- Create new tables
CREATE TABLE "app"."account_balances" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"account_id" uuid NOT NULL,
	"balance" numeric(15, 2) DEFAULT 0 NOT NULL,
	"create_at" timestamp with time zone DEFAULT now(),
	"update_at" timestamp with time zone,
	CONSTRAINT "account_balances_unq_account_id" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "app"."account_groups" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"parent_group_id" uuid DEFAULT 'f3cddbaf-cd30-4846-9a92-2b6fce7aca7e',
	"type" "account_group_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "debit_credit_enum" NOT NULL,
	"currency_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"account_group_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_archive" boolean DEFAULT false,
	"icon" varchar(20),
	"create_at" timestamp with time zone DEFAULT now(),
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"type" "journal_entry_type" NOT NULL,
	"currency_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"title" varchar(255),
	"description" text,
	"create_at" timestamp with time zone DEFAULT now(),
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."journal_entry_fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"base_currency_id" uuid NOT NULL,
	"target_currency_id" uuid NOT NULL,
	"rate" numeric NOT NULL,
	"create_at" timestamp with time zone DEFAULT now(),
	"update_at" timestamp with time zone,
	CONSTRAINT "journal_entry_fx_rates_unq_entry_base_target" UNIQUE("journal_entry_id","base_currency_id","target_currency_id")
);
--> statement-breakpoint
CREATE TABLE "app"."transactions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" "debit_credit_enum" NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"create_at" timestamp with time zone DEFAULT now(),
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "config"."countries" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(3) NOT NULL,
	"code_alpha2" varchar(2) NOT NULL,
	"default_currency_id" uuid,
	"emoji" varchar(3),
	"create_at" timestamp with time zone DEFAULT now(),
	"update_at" timestamp with time zone,
	CONSTRAINT "countries_code_unique" UNIQUE("code"),
	CONSTRAINT "countries_codeAlpha2_unique" UNIQUE("code_alpha2")
);
--> statement-breakpoint
CREATE TABLE "config"."currencies" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" "currency_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(3) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"symbol_native" varchar(10) NOT NULL,
	"iso_digits" integer DEFAULT 0 NOT NULL,
	"create_at" timestamp with time zone DEFAULT now(),
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "config"."forex" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"date" date NOT NULL,
	"base_currency" varchar NOT NULL,
	"target_currency" varchar NOT NULL,
	"rate" numeric NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config"."information" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	CONSTRAINT "information_unq_name" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "app"."account_balances" ADD CONSTRAINT "account_balances_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "app"."accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."account_groups" ADD CONSTRAINT "account_groups_parent_group_id_account_groups_id_fk" FOREIGN KEY ("parent_group_id") REFERENCES "app"."account_groups"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "config"."countries"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_account_group_id_account_groups_id_fk" FOREIGN KEY ("account_group_id") REFERENCES "app"."account_groups"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entries" ADD CONSTRAINT "journal_entries_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "app"."journal_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_base_currency_id_currencies_id_fk" FOREIGN KEY ("base_currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_target_currency_id_currencies_id_fk" FOREIGN KEY ("target_currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."transactions" ADD CONSTRAINT "transactions_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "app"."journal_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "app"."accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "account_balances_idx_account_id" ON "app"."account_balances" USING btree ("account_id","id");--> statement-breakpoint
CREATE INDEX "account_groups_idx_parent_group_id" ON "app"."account_groups" USING btree ("parent_group_id");--> statement-breakpoint
CREATE INDEX "account_groups_idx_type" ON "app"."account_groups" USING btree ("type");--> statement-breakpoint
CREATE INDEX "accounts_idx_type" ON "app"."accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "accounts_idx_country_id" ON "app"."accounts" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "accounts_idx_account_group_id" ON "app"."accounts" USING btree ("account_group_id");--> statement-breakpoint
CREATE INDEX "journal_entries_idx_type" ON "app"."journal_entries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "journal_entries_idx_date" ON "app"."journal_entries" USING btree ("date");--> statement-breakpoint
CREATE INDEX "journal_entry_fx_rates_idx_create_at_base_currency_id_target_currency_id" ON "app"."journal_entry_fx_rates" USING btree ("create_at","base_currency_id","target_currency_id");--> statement-breakpoint
CREATE INDEX "transactions_idx_journal_entry_id" ON "app"."transactions" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "transactions_idx_account_id" ON "app"."transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "countries_idx_code_id" ON "config"."countries" USING btree ("code","id");--> statement-breakpoint
CREATE INDEX "countries_idx_code_alpha_2_code" ON "config"."countries" USING btree ("code_alpha2","code");--> statement-breakpoint
CREATE INDEX "currencies_idx_code_id" ON "config"."currencies" USING btree ("code","id");--> statement-breakpoint
CREATE UNIQUE INDEX "currencies_unq_code_type" ON "config"."currencies" USING btree ("code","type");--> statement-breakpoint
CREATE INDEX "forex_idx_create_at_base_currency_target_currency" ON "config"."forex" USING btree ("create_at","base_currency","target_currency");--> statement-breakpoint
CREATE INDEX "information_idx_name_value" ON "config"."information" USING btree ("name","value");

-- Insert data from the old tables to the new table
-- First with config schema
INSERT INTO config.currencies (id, type, name, code, symbol, symbol_native, iso_digits, create_at, update_at)
SELECT occc.uuid, occc.type, occc.name, occc.code, occc.symbol, occc.symbol_native, occc.iso_digits, occc.create_at, occc.update_at
FROM old_config.currencies occc;

INSERT INTO config.countries (id, name, code, code_alpha2, default_currency_id, emoji, create_at, update_at)
SELECT occr.uuid, occr.name, occr.code, occr.code_alpha2, occc.uuid, occr.emoji, occr.create_at, occr.update_at
FROM old_config.countries occr
JOIN old_config.currencies occc ON occc.id = occr.default_currency_id;

INSERT INTO config.information (id, name, value)
SELECT oci.uuid, oci.name, oci.value
FROM old_config.information oci;

INSERT INTO config.forex (id, date, base_currency, target_currency, rate, create_at)
SELECT ocf.uuid, ocf.date, ocf.base_currency, ocf.target_currency, ocf.rate, ocf.create_at
FROM old_config.forex ocf;

-- Now it's time for app schema
INSERT INTO app.account_groups (id, parent_group_id, type, name, description, sort_order, is_hidden)
SELECT oaag.uuid, null, oaag.type, oaag.name, oaag.description, oaag.sort_order, oaag.is_hidden
FROM old_app.account_groups oaag;

INSERT INTO app.accounts (id, name, type, currency_id, country_id, account_group_id, sort_order, is_archive, icon, create_at, update_at)
SELECT oaa.uuid, oaa.name, oaa.type, occc.uuid, occr.uuid, oaag.uuid, oaa.sort_order, oaa.is_archive, oaa.icon, oaa.create_at, oaa.update_at
FROM old_app.accounts oaa
JOIN old_config.currencies occc ON occc.id = oaa.currency_id
JOIN old_config.countries occr ON occr.id = oaa.country_id
JOIN old_app.account_groups oaag ON oaag.id = oaa.account_group_id;

INSERT INTO app.account_balances (id, account_id, balance, create_at, update_at)
SELECT oaab.uuid, oaa.uuid, oaab.balance, oaab.create_at, oaab.update_at
FROM old_app.account_balances oaab
JOIN old_app.accounts oaa ON oaa.id = oaab.account_id;

INSERT INTO app.journal_entries (id, date, type, currency_id, amount, title, description, create_at, update_at)
SELECT oaje.uuid, oaje.date, oaje.type, occc.uuid, oaje.amount, oaje.title, oaje.description, oaje.create_at, oaje.update_at
FROM old_app.journal_entries oaje
JOIN old_config.currencies occc ON occc.id = oaje.currency_id;

INSERT INTO app.journal_entry_fx_rates (id, journal_entry_id, base_currency_id, target_currency_id, rate, create_at, update_at)
SELECT oajef.uuid, oaje.uuid, occcb.uuid, occct.uuid, oajef.rate, oajef.create_at, oajef.update_at
FROM old_app.journal_entry_fx_rates oajef
JOIN old_app.journal_entries oaje ON oaje.id = oajef.journal_entry_id
JOIN old_config.currencies occcb ON occcb.id = oajef.base_currency_id
JOIN old_config.currencies occct ON occct.id = oajef.target_currency_id;

INSERT INTO app.transactions (id, type, journal_entry_id, account_id, amount, description, create_at, update_at)
SELECT oat.uuid, oat.type, oaje.uuid, oaa.uuid, oat.amount, oat.description, oat.create_at, oat.update_at
FROM old_app.transactions oat
JOIN old_app.journal_entries oaje ON oaje.id = oat.journal_entry_id
JOIN old_app.accounts oaa ON oaa.id = oat.account_id;

-- Now drop old tables and schemas
DROP TABLE old_config.currencies, old_config.countries, old_config.information, old_config.forex 
CASCADE;

DROP TABLE old_app.account_groups, old_app.accounts, old_app.account_balances, old_app.journal_entries, old_app.journal_entry_fx_rates, old_app.transactions
CASCADE;

DROP SCHEMA old_config CASCADE;
DROP SCHEMA old_app CASCADE;

COMMIT;