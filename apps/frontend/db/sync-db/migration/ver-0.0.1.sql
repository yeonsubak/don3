CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA "config";
--> statement-breakpoint
CREATE SCHEMA "sync";
--> statement-breakpoint
CREATE TYPE "public"."algorithm_enum" AS ENUM('AES-GCM', 'AES-KW', 'RSA');--> statement-breakpoint
CREATE TYPE "public"."encrypt_key_registry_type_enum" AS ENUM('symmetric', 'asymmetric');--> statement-breakpoint
CREATE TYPE "public"."encrypt_key_type_enum" AS ENUM('single', 'private', 'public');--> statement-breakpoint
CREATE TYPE "public"."snapshot_type_enum" AS ENUM('autosave', 'user');--> statement-breakpoint
CREATE TABLE "sync"."encrypt_key_registry" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" "encrypt_key_registry_type_enum" NOT NULL,
	"user_id" text NOT NULL,
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
CREATE TABLE "config"."information" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	CONSTRAINT "information_unq_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sync"."operation_log_sync_status" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"log_id" uuid NOT NULL,
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
	CONSTRAINT "operation_log_unq_device_id_sequence" UNIQUE("device_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "sync"."snapshot_sync_status" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"is_uploaded" boolean DEFAULT false NOT NULL,
	"upload_at" timestamp with time zone,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync"."snapshots" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" "snapshot_type_enum" NOT NULL,
	"meta" jsonb NOT NULL,
	"dump" text NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone
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
ALTER TABLE "sync"."encrypt_keys" ADD CONSTRAINT "encrypt_keys_registry_id_encrypt_key_registry_id_fk" FOREIGN KEY ("registry_id") REFERENCES "sync"."encrypt_key_registry"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sync"."operation_log_sync_status" ADD CONSTRAINT "operation_log_sync_status_log_id_operation_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "sync"."operation_logs"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sync"."snapshot_sync_status" ADD CONSTRAINT "snapshot_sync_status_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "sync"."snapshots"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "information_idx_name_value" ON "config"."information" USING btree ("name","value");--> statement-breakpoint
CREATE INDEX "temp_key_store_idx_expire_at" ON "sync"."tempKeyStore" USING btree ("expire_at" DESC NULLS LAST);