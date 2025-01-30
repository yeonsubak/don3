'use client';

import { PGliteDrizzleWorker, type PgliteDrizzle } from '@/db/pglite-web-worker';

export abstract class Service {
  protected static instance: Service;
  protected drizzle!: PgliteDrizzle;

  protected constructor() {}

  protected static async createInstance(): Promise<Service> {
    throw new Error('Must be implemented by subclasses');
  }

  public static async getInstance<T extends Service>(): Promise<T> {
    if (!this.instance) {
      this.instance = await this.createInstance();
      this.instance.drizzle = await PGliteDrizzleWorker.create();
    }

    return this.instance as T;
  }
}
