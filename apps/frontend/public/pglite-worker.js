import { PGlite } from '@electric-sql/pglite';
import { worker } from '@electric-sql/pglite/worker';
import { live } from '@electric-sql/pglite/live';

worker({
  async init() {
    return await PGlite.create({
      dataDir: 'idb://localhost:3000', // TODO: change it to .env
      relaxedDurability: true,
      extensions: { live },
    });
  },
});
