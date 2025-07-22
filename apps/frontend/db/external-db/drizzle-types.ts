import * as schema from '@/db/external-db/migration/schema';

export type ExternalForexInsert = typeof schema.forex.$inferInsert;
export type ExternalForexSelect = typeof schema.forex.$inferSelect;
