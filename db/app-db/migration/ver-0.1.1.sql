ALTER TABLE "app"."account_balances" RENAME TO "asset_liability_balances";--> statement-breakpoint
ALTER TABLE "app"."asset_liability_balances" DROP CONSTRAINT "account_balances_unq_account_id";--> statement-breakpoint
ALTER TABLE "app"."asset_liability_balances" DROP CONSTRAINT "account_balances_account_id_accounts_id_fk";
--> statement-breakpoint
DROP INDEX "app"."account_balances_idx_account_id";--> statement-breakpoint
ALTER TABLE "app"."asset_liability_balances" ADD CONSTRAINT "asset_liability_balances_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "app"."accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_liability_balances_idx_account_id" ON "app"."asset_liability_balances" USING btree ("account_id","id");--> statement-breakpoint
ALTER TABLE "app"."asset_liability_balances" ADD CONSTRAINT "asset_liability_balances_unq_account_id" UNIQUE("account_id");