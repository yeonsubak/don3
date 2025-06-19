CREATE SCHEMA "sync";
--> statement-breakpoint
CREATE TYPE "public"."algorithm_enum" AS ENUM('AES-GCM', 'AES-KW', 'RSA');--> statement-breakpoint
CREATE TYPE "public"."encrypt_key_registry_type_enum" AS ENUM('symmetric', 'asymmetric');--> statement-breakpoint
CREATE TYPE "public"."encrypt_key_type_enum" AS ENUM('single', 'private', 'public');--> statement-breakpoint
CREATE TABLE "sync"."encrypt_key_registry" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" "encrypt_key_registry_type_enum" NOT NULL,
	"username" varchar(255) NOT NULL,
	"credential_id" varchar(255) NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync"."encrypt_keys" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"registry_id" uuid NOT NULL,
	"type" "encrypt_key_type_enum" NOT NULL,
	"algorithm" "algorithm_enum" NOT NULL,
	"key" text NOT NULL,
	"is_key_wrapped" boolean NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync"."operation_log_sync_status" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"log_id" uuid,
	"is_uploaded" boolean DEFAULT false NOT NULL,
	"upload_at" timestamp with time zone,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync"."operation_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"version" varchar(255) NOT NULL,
	"schema_version" varchar(255) NOT NULL,
	"device_id" uuid NOT NULL,
	"sequence" bigint NOT NULL,
	"method" varchar(255) NOT NULL,
	"method_hash" text NOT NULL,
	"op_data" jsonb NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone,
	CONSTRAINT "operation_log_unq_username_device_id_sequence" UNIQUE("device_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "sync"."tempKeyStore" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"serialized_key" text NOT NULL,
	"expire_at" timestamp with time zone NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "app"."accounts" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."asset_liability_balances" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."journal_entries" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."transactions" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "config"."countries" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "config"."currencies" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sync"."encrypt_keys" ADD CONSTRAINT "encrypt_keys_registry_id_encrypt_key_registry_id_fk" FOREIGN KEY ("registry_id") REFERENCES "sync"."encrypt_key_registry"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sync"."operation_log_sync_status" ADD CONSTRAINT "operation_log_sync_status_log_id_operation_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "sync"."operation_logs"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "temp_key_store_idx_expire_at" ON "sync"."tempKeyStore" USING btree ("expire_at" DESC NULLS LAST);