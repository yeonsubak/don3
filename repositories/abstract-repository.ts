import type { AppDrizzle, Drizzle } from '@/db';
import type { PgliteTransaction, SchemaExtracted } from '@/db/app-db/drizzle-types';

export abstract class Repository<TSchema extends Record<string, unknown>> {
  protected db: Drizzle<TSchema> | PgliteTransaction<TSchema, SchemaExtracted<TSchema>>;

  constructor(db: Drizzle<TSchema> | PgliteTransaction<TSchema, SchemaExtracted<TSchema>>) {
    this.db = db;
  }

  public async withTx<T>(
    processingFn: (tx: PgliteTransaction<TSchema, SchemaExtracted<TSchema>>) => Promise<T>,
  ) {
    return await this.db.transaction(processingFn);
  }
}
