import type { PgliteDrizzle } from '@/db';
import type { PgliteTransaction } from '@/db/drizzle/types';

export abstract class Repository {
  protected db!: PgliteDrizzle | PgliteTransaction;

  constructor(db: PgliteDrizzle | PgliteTransaction) {
    this.db = db;
  }

  public async withTx<T>(processingFn: (tx: PgliteTransaction) => Promise<T>) {
    return await this.db.transaction(processingFn);
  }
}
