import { DATASET_ACCOUNT_GROUPS } from '@/db/dataset/account-groups';
import { DATASET_ASSET_ACCOUNTS, DATASET_EXPENSE_ACCOUNTS } from '@/db/dataset/accounts';
import * as schema from '@/db/drizzle/schema';
import type { PgliteDrizzle } from '@/db/pglite-drizzle';
import { count, type InferInsertModel } from 'drizzle-orm';
import type { PgTable, TableConfig } from 'drizzle-orm/pg-core';
import { Service } from './service-primitive';

type DatasetInsert = InferInsertModel<typeof schema.accountGroups | typeof schema.accounts>;

export class DemoService extends Service {
  constructor(drizzle: PgliteDrizzle) {
    super(drizzle);
  }

  public async initializeDemoData() {
    if (await this.hasAccountGroups()) {
      return;
    }

    await Promise.all([
      this.insertDataset(DATASET_ACCOUNT_GROUPS, schema.accountGroups),
      this.insertDataset(DATASET_ASSET_ACCOUNTS, schema.accounts),
      this.insertDataset(DATASET_EXPENSE_ACCOUNTS, schema.accounts),
    ]);
  }

  private async hasAccountGroups() {
    const cnt = (
      await this.drizzle.getDb().select({ count: count() }).from(schema.accountGroups)
    ).at(0)?.count;
    return (cnt ?? 0) > 0;
  }

  private async insertDataset(dataset: DatasetInsert[], table: PgTable<TableConfig>) {
    await this.drizzle.getDb().insert(table).values(dataset).onConflictDoNothing();
  }
}
