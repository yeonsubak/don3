import { IdbFs, PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { live } from '@electric-sql/pglite/live';
import { worker } from '@electric-sql/pglite/worker';

worker({
  async init() {
    return await PGlite.create({
      fs: new IdbFs('don3'),
      relaxedDurability: true,
      extensions: { live, uuid_ossp }
    });
  },
});
