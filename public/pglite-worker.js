import { PGlite, IdbFs } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';
import { live } from '@electric-sql/pglite/live';

worker({
  async init() {
    return await PGlite.create({
      fs: new IdbFs('don3'),
      relaxedDurability: true,
      extensions: { live },
    });
  },
});
