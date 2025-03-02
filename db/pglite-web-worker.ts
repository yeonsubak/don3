import type { PGlite } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';
import { PGliteWorker } from '@electric-sql/pglite/worker';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { DBInitializer } from './db-initializer';
import schema from './drizzle/schema';

export type PgliteDrizzle = PgliteDatabase<typeof schema> & {
  $client: PGlite;
};

export class PGliteDrizzleWorker {
  public static async create(): Promise<PgliteDrizzle> {
    const dbInitializer = await DBInitializer.getInstance();
    await dbInitializer.ensureDbReady();

    const pg = await PGliteWorker.create(
      new Worker(new URL('../public/pglite-worker.js', import.meta.url), {
        type: 'module',
      }),
      {
        extensions: { live },
      },
    );

    // @ts-expect-error It's a type problem. //TODO: change the message
    return drizzle(pg, {
      schema,
      casing: 'snake_case',
    });
  }
}
