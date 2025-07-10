import { SYNC_DB_NAME } from '@/lib/constants';
import { PGliteClient } from './pglite-client';

export class PGliteSync extends PGliteClient {
  private static instance: PGliteSync | null = null;

  private constructor() {
    super(SYNC_DB_NAME);
  }

  public static getInstance() {
    if (!PGliteSync.instance) {
      PGliteSync.instance = new PGliteSync();
    }

    return PGliteSync.instance;
  }

  public static async closeInstance() {
    if (this.instance) {
      await this.instance.syncToFs();
      await this.instance.close();
      this.instance = null;
    }
  }
}
