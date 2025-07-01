import type { PGliteWorker } from '@electric-sql/pglite/worker';
import type { Drizzle } from '.';
import type { PGliteClient } from './pglite/pglite-client';

export type InitializationOptions = {
  isDBReady?: boolean;
  closeAfterInit?: boolean;
};

export abstract class DBInitializer {
  protected static instance: DBInitializer | null;
  protected pg: PGliteClient | PGliteWorker | null = null;
  protected db: Drizzle<Record<string, unknown>> | null = null;

  public isInitialized = false;
  protected initializationPromise: Promise<void> | null = null;

  protected constructor() {}

  protected static async getInstance(): Promise<DBInitializer> {
    throw new Error('getInstance() must be implemented in subclass');
  }

  public async ensureDbReady() {
    if (this.isInitialized) return;

    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = this.initialize({ isDBReady: false });
    await this.initializationPromise;
    this.initializationPromise = null;
  }

  protected abstract initialize(options: InitializationOptions): Promise<void>;

  protected abstract validateSchemaVersion(isDBReady: boolean): Promise<boolean>;

  protected abstract syncSchema(): Promise<void>;
}
