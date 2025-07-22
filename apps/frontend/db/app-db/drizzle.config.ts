import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: 'db/app-db/schema',
  out: 'db/app-db/migration',
  driver: 'pglite',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
  casing: 'snake_case',
});
