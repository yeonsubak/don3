import { IdbFs, PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';

worker({
  async init() {
    return await PGlite.create({
      fs: new IdbFs('don3'),
      relaxedDurability: true,
    });
  },
});
