import type { PgliteDrizzle } from '@/db/pglite-web-worker';

export class Service {
  protected drizzle: PgliteDrizzle;

  constructor(drizzle: PgliteDrizzle) {
    this.drizzle = drizzle;
  }
}
