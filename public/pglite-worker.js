import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';
import { live } from '@electric-sql/pglite/live';

worker({
  async init() {
    return await PGlite.create({
      dataDir: 'idb://don3',
      relaxedDurability: true,
      extensions: { live },
    });
  },
});
