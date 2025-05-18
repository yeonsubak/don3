import { accounts } from '@/db/drizzle/schema';
import { z } from 'zod';

export const accountForm = z.object({
  accountId: z.string().nullable(),
  accountGroupId: z.coerce.string().min(1),
  accountName: z
    .string()
    .min(1, {
      message: 'Name must be at least 1 character.',
    })
    .max(255, { message: 'Name must be less than 255 characters.' }),
  accountType: z.enum(accounts.type.enumValues),
  currencyCode: z.string().min(3).max(3),
  countryCode: z.string().min(3).max(3),
  icon: z.string().nullish(),
});

export type AccountForm = z.infer<typeof accountForm>;
