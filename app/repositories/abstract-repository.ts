import type { PgliteTransaction } from '@/db/drizzle/types';
import { PGliteDrizzleWorker, type PgliteDrizzle } from '@/db/pglite-web-worker';

export abstract class Repository {
  protected static instance: Repository;
  protected db!: PgliteDrizzle;

  protected constructor() {}

  protected static async createInstance(): Promise<Repository> {
    throw new Error('Must be implemented by subclasses');
  }

  public static async getInstance<T extends Repository>(): Promise<T> {
    if (!this.instance) {
      this.instance = await this.createInstance();
      this.instance.db = await PGliteDrizzleWorker.create();
    }

    return this.instance as T;
  }

  public async withTx<T>(processingFn: (tx: PgliteTransaction) => Promise<T>) {
    return await this.db.transaction(processingFn);
  }
}
