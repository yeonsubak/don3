import { PGlite } from '@electric-sql/pglite';

export class PgliteClient extends PGlite {
  private static instance: PgliteClient | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): PgliteClient | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!PgliteClient.instance) {
      PgliteClient.instance = new PGlite({
        dataDir: 'idb://don3',
        relaxedDurability: true,
      });
    }

    return PgliteClient.instance;
  }
}
