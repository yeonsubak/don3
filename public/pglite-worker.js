import { IdbFs, PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { live } from '@electric-sql/pglite/live';
import { worker } from '@electric-sql/pglite/worker';

worker({
  async init(options) {
    const { dbName } = options.meta;
    return new PGlite({
      fs: new IdbFs(dbName),
      relaxedDurability: true,
      extensions: { uuid_ossp, live },
    });
  },
});
