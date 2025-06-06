'use client';

import { live, type LiveNamespace } from '@electric-sql/pglite/live';
import { PGliteWorker as _PGliteWorker } from '@electric-sql/pglite/worker';
import { DBInitializer } from './db-initializer';

export type PGliteWorkerClient = _PGliteWorker & {
  live: LiveNamespace;
};

export class PGliteWorker {
  private constructor() {}

  public static instance: PGliteWorker | null;

  public static async getInstance() {
    if (!PGliteWorker.instance) {
      PGliteWorker.instance = new PGliteWorker(); // avoid race condition on object creation
      await this.ensureDBReady();
      PGliteWorker.instance = await this.createWorker();
    }

    return PGliteWorker.instance;
  }

  public static async close() {
    if (PGliteWorker.instance) {
      const instance = PGliteWorker.instance as PGliteWorkerClient;
      if (!instance.closed) {
        await instance.close();
      }
      PGliteWorker.instance = null;
    }
  }

  public static async createNewInstance(): Promise<PGliteWorker> {
    await this.ensureDBReady();
    return await this.createWorker();
  }

  private static async createWorker() {
    return await _PGliteWorker.create(
      new Worker(new URL('@/public/pglite-worker.js', import.meta.url), {
        type: 'module',
      }),
      {
        extensions: { live },
      },
    );
  }

  private static async ensureDBReady() {
    const dbInitializer = await DBInitializer.getInstance();
    await dbInitializer.ensureDbReady();
  }
}
