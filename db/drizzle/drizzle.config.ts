import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: 'db/drizzle/schema',
  out: 'db/drizzle/migration',
  driver: 'pglite',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
  casing: 'snake_case',
});
