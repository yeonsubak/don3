import { INDEXEDDB_NAME } from '@/db/db-constants';
import { IdbFs, PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
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
        fs: new IdbFs(INDEXEDDB_NAME),
        relaxedDurability: true,
        extensions: { live, uuid_ossp },
      });
    }

    return PgliteClient.instance;
  }
}
