import { IdbFs, PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { live } from '@electric-sql/pglite/live';

export class PGliteClient extends PGlite {
  constructor(indexedDBName: string) {
    super({
      fs: new IdbFs(indexedDBName),
      relaxedDurability: true,
      extensions: { live, uuid_ossp },
    });
  }
}
