'use client';

import { APP_DB_NAME } from '@/lib/constants';
import type { LiveNamespace } from '@electric-sql/pglite/live';
import { PGliteWorker } from '@electric-sql/pglite/worker';
import { AppDBInitializer } from '../app-db/app-db-initializer';

export class PGliteAppWorker extends PGliteWorker {
  protected static instance: PGliteAppWorker | null = null;
  public live!: LiveNamespace;

  protected constructor() {
    const worker = new Worker(new URL('@/public/pglite-worker.js', import.meta.url), {
      type: 'module',
    });

    super(worker, {
      meta: {
        dbName: APP_DB_NAME(),
      },
    });
  }

  public static async getInstance(ensureDBReady?: boolean): Promise<PGliteAppWorker> {
    if (!PGliteAppWorker.instance) {
      PGliteAppWorker.instance = new PGliteAppWorker();
    }

    if (ensureDBReady) {
      await this.ensureDBReady();
    }

    return PGliteAppWorker.instance;
  }

  protected static async ensureDBReady() {
    const dbInitializer = await AppDBInitializer.getInstance();
    await dbInitializer.ensureDbReady();
  }
}
