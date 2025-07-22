import type { Drizzle } from '@/db';
import type { SchemaExtracted } from '@/db/app-db/drizzle-types';
import type { PGliteClient } from '@/db/pglite/pglite-client';
import type { Transaction } from '@electric-sql/pglite';
import { PgDatabase } from 'drizzle-orm/pg-core';
import { PgliteTransaction } from 'drizzle-orm/pglite';

export abstract class Repository<TSchema extends Record<string, unknown>> {
  protected db: Drizzle<TSchema> | PgliteTransaction<TSchema, SchemaExtracted<TSchema>>;
  protected pg?: PGliteClient | Transaction;

  constructor(db: Drizzle<TSchema> | PgliteTransaction<TSchema, SchemaExtracted<TSchema>>) {
    this.db = db;
    if (db instanceof PgliteTransaction) {
      this.pg = (this.db._.session as unknown as { client?: Transaction })?.client;
      return;
    }

    if (db instanceof PgDatabase) {
      this.pg = (this.db as Drizzle<TSchema>).$client;
      return;
    }
  }

  public async withTx<T>(
    processingFn: (tx: PgliteTransaction<TSchema, SchemaExtracted<TSchema>>) => Promise<T>,
  ) {
    return await this.db.transaction(processingFn);
  }
}
