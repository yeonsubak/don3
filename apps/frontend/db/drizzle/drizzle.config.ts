import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: 'db/drizzle/schema.ts',
  out: 'db/drizzle/migration',
  driver: 'pglite',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
  casing: 'snake_case',
});
