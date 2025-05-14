import { sql } from 'drizzle-orm';

export const generateRandomUUID = sql`uuid_generate_v4()`;
