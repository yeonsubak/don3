import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: 'db/sync-db/schema.ts',
  out: 'db/sync-db/migration',
  driver: 'pglite',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
  casing: 'snake_case',
});
