import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: 'db/external-db/migration',
  schema: 'db/external-db/migration/schema.ts',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.EXTERNAL_DATABASE_URL!,
  },
});
