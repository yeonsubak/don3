import type { Drizzle } from '.';
import type { PGliteClient } from './pglite/pglite-client';

export abstract class DBInitializer {
  protected static instance: DBInitializer | null;
  protected pg: PGliteClient | null = null;
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

    this.initializationPromise = this.initialize(false);
    await this.initializationPromise;
    this.initializationPromise = null;
  }

  protected abstract initialize(isDBReady: boolean): Promise<void>;

  protected abstract validateSchemaVersion(isDBReady: boolean): Promise<boolean>;

  protected abstract syncSchema(): Promise<void>;
}
