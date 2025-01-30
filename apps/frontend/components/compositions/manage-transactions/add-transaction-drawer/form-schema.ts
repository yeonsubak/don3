import { parseNumber } from '@/components/common-functions';
import { journalEntryTypeEnum } from '@/db/drizzle/schema';
import { z } from 'zod';

export type TransactionForm = z.infer<typeof transactionForm>;

export const transactionForm = z.object({
  date: z.date(),
  time: z.object({
    hour: z.coerce.number().gte(0).lte(24),
    minute: z.coerce.number().gte(0).lte(59),
  }),
  journalEntryType: z.enum(journalEntryTypeEnum.enumValues),
  currencyCode: z.string().min(3).max(3),
  amount: z
    .string()
    .min(1)
    .default('')
    .refine((val) => parseNumber(val), { message: 'Invalid amount' }),
  title: z.string(),
  description: z.string(),
  debitAccountId: z.coerce.number(),
  creditAccountId: z.coerce.number(),
  countryCode: z.string(), // Not for mutation
});

export const incomeTransactionForm = transactionForm.extend({});
