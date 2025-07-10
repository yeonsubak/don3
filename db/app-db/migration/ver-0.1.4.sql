CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA "app";
--> statement-breakpoint
CREATE SCHEMA "config";
--> statement-breakpoint
CREATE TYPE "public"."account_group_type" AS ENUM('asset', 'liability', 'income', 'expense', 'uncategorized');--> statement-breakpoint
CREATE TYPE "public"."debit_credit_enum" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."journal_entry_type" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."currency_type" AS ENUM('fiat', 'crypto');--> statement-breakpoint
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."asset_liability_balances" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"account_id" uuid NOT NULL,
	"balance" numeric(15, 2) DEFAULT 0 NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone,
	CONSTRAINT "asset_liability_balances_unq_account_id" UNIQUE("account_id")
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."journal_entry_fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"base_currency_id" uuid NOT NULL,
	"target_currency_id" uuid NOT NULL,
	"rate" numeric NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
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
ALTER TABLE "app"."account_groups" ADD CONSTRAINT "account_groups_parent_group_id_account_groups_id_fk" FOREIGN KEY ("parent_group_id") REFERENCES "app"."account_groups"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "config"."countries"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_account_group_id_account_groups_id_fk" FOREIGN KEY ("account_group_id") REFERENCES "app"."account_groups"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."asset_liability_balances" ADD CONSTRAINT "asset_liability_balances_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "app"."accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entries" ADD CONSTRAINT "journal_entries_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "app"."journal_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_base_currency_id_currencies_id_fk" FOREIGN KEY ("base_currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_target_currency_id_currencies_id_fk" FOREIGN KEY ("target_currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."transactions" ADD CONSTRAINT "transactions_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "app"."journal_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "app"."accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "account_groups_idx_parent_group_id" ON "app"."account_groups" USING btree ("parent_group_id");--> statement-breakpoint
CREATE INDEX "account_groups_idx_type" ON "app"."account_groups" USING btree ("type");--> statement-breakpoint
CREATE INDEX "accounts_idx_type" ON "app"."accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "accounts_idx_country_id" ON "app"."accounts" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "accounts_idx_account_group_id" ON "app"."accounts" USING btree ("account_group_id");--> statement-breakpoint
CREATE INDEX "asset_liability_balances_idx_account_id" ON "app"."asset_liability_balances" USING btree ("account_id","id");--> statement-breakpoint
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