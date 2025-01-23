import type { PgliteDrizzle } from '@/db/pglite-drizzle';

export class Service {
  protected drizzle: PgliteDrizzle;

  constructor(drizzle: PgliteDrizzle) {
    this.drizzle = drizzle;
  }
}
