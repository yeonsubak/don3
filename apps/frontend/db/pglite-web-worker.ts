'use client';

import { live } from '@electric-sql/pglite/live';
import { PGliteWorker as _PGliteWorker } from '@electric-sql/pglite/worker';
import { DBInitializer } from './db-initializer';

export class PGliteWorker {
  private constructor() {}

  private static instance: PGliteWorker;

  public static async getInstance() {
    if (!PGliteWorker.instance) {
      PGliteWorker.instance = new PGliteWorker();
      const dbInitializer = await DBInitializer.getInstance();
      await dbInitializer.ensureDbReady();
      const worker = await _PGliteWorker.create(
        new Worker(new URL('@/public/pglite-worker.js', import.meta.url), {
          type: 'module',
        }),
        {
          extensions: { live },
        },
      );

      PGliteWorker.instance = worker;
    }

    return PGliteWorker.instance;
  }
}
