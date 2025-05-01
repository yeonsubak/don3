import { accountGroups } from '@/db/drizzle/schema';
import { z } from 'zod';

export const createAccountGroupForm = z.object({
  type: z.enum(accountGroups.type.enumValues),
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }),
  description: z.string().optional(),
});

export type CreateAccountGroupForm = z.infer<typeof createAccountGroupForm>;
