import { PGlite, IdbFs } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';

export class PgliteClient extends PGlite {
  private static instance: PgliteClient | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): PgliteClient | null {
    // Disable rendering on server side
    if (typeof window === 'undefined') {
      return null;
    }

    if (!PgliteClient.instance) {
      PgliteClient.instance = new PGlite({
        fs: new IdbFs('don3'),
        relaxedDurability: true,
        extensions: { live },
      });
    }

    return PgliteClient.instance;
  }
}
