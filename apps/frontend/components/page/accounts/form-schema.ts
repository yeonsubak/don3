import { accounts } from '@/db/drizzle/schema';
import { z } from 'zod';

export const createAccountForm = z.object({
  accountName: z
    .string()
    .min(1, {
      message: 'Name must be at least 1 character.',
    })
    .max(255, { message: 'Name must be less than 255 characters.' }),
  accountType: z.enum(accounts.type.enumValues),
  currencyCode: z.string().min(3).max(3),
  countryCode: z.string().min(3).max(3),
  accountGroupId: z.string(),
});

export type CreateAccountForm = z.infer<typeof createAccountForm>;
