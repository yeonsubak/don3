'use client';

import { live } from '@electric-sql/pglite/live';
import { PGliteWorker as _PGliteWorker } from '@electric-sql/pglite/worker';
import { DBInitializer } from './db-initializer';

export class PGliteWorker {
  private constructor() {}

  private static instance: PGliteWorker;

  public static async getInstance() {
    if (!PGliteWorker.instance) {
      PGliteWorker.instance = new PGliteWorker(); // avoid race condition on object creation
      await this.ensureDBReady();
      PGliteWorker.instance = await this.createWorker();
    }

    return PGliteWorker.instance;
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
