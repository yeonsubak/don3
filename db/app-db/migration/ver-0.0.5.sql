ALTER TABLE "app"."account_groups" DROP CONSTRAINT "account_groups_parent_group_id_account_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."accounts" DROP CONSTRAINT "accounts_currency_id_currencies_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."accounts" DROP CONSTRAINT "accounts_country_id_countries_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."accounts" DROP CONSTRAINT "accounts_account_group_id_account_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."journal_entries" DROP CONSTRAINT "journal_entries_currency_id_currencies_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" DROP CONSTRAINT "journal_entry_fx_rates_journal_entry_id_journal_entries_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" DROP CONSTRAINT "journal_entry_fx_rates_base_currency_id_currencies_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" DROP CONSTRAINT "journal_entry_fx_rates_target_currency_id_currencies_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."transactions" DROP CONSTRAINT "transactions_journal_entry_id_journal_entries_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."transactions" DROP CONSTRAINT "transactions_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."account_groups" ADD CONSTRAINT "account_groups_parent_group_id_account_groups_id_fk" FOREIGN KEY ("parent_group_id") REFERENCES "app"."account_groups"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "config"."countries"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_account_group_id_account_groups_id_fk" FOREIGN KEY ("account_group_id") REFERENCES "app"."account_groups"("id") ON DELETE set default ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entries" ADD CONSTRAINT "journal_entries_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "app"."journal_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_base_currency_id_currencies_id_fk" FOREIGN KEY ("base_currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."journal_entry_fx_rates" ADD CONSTRAINT "journal_entry_fx_rates_target_currency_id_currencies_id_fk" FOREIGN KEY ("target_currency_id") REFERENCES "config"."currencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."transactions" ADD CONSTRAINT "transactions_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "app"."journal_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "app"."accounts"("id") ON DELETE cascade ON UPDATE cascade;