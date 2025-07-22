ALTER TABLE "app"."accounts" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."asset_liability_balances" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."journal_entries" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."transactions" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "config"."countries" ALTER COLUMN "create_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "config"."currencies" ALTER COLUMN "create_at" SET NOT NULL;