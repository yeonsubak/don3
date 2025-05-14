import { parseNumber } from '@/components/common-functions';
import { journalEntryTypeEnum } from '@/db/drizzle/schema';
import { z } from 'zod';

const validateFxRate = (data: { isFx: boolean; fxRate: string }) => {
  if (!data.isFx) return true;

  const parsed = parseNumber(data.fxRate, 10);
  if (!parsed) return false;
  if (parsed <= 0) return false;

  return true;
};
const fxRateErrorMsg = {
  message: 'Exchange rate must be greater than 0',
  path: ['fxRate'],
};

export const baseTxForm = z
  .object({
    date: z.coerce.date(),
    time: z.object({
      hour: z.coerce.number().gte(0).lte(23),
      minute: z.coerce.number().gte(0).lte(59),
    }),
    journalEntryType: z.enum(journalEntryTypeEnum.enumValues),
    currencyCode: z.string().min(3).max(3),
    amount: z.string().min(1).default('').refine(parseNumber, { message: 'Invalid amount' }),
    fxRate: z.string().default(''),
    fxAmount: z.string().default(''),
    title: z.string().min(1, { message: 'Title must be longer than 1 character.' }),
    description: z.string(),
    isFx: z.boolean().default(false), // Not for mutation
  })
  .refine(validateFxRate, fxRateErrorMsg)._def.schema;

export type ExpenseTxForm = z.infer<typeof expenseTxForm>;
export const expenseTxForm = baseTxForm.extend({
  countryCode: z.string(), // Not for mutation
  debitAccountId: z.coerce.string().uuid({ message: "Please select 'Paid by' account" }),
  creditAccountId: z.coerce.string().uuid({ message: 'Please select the category' }),
});

export type IncomeTxForm = z.infer<typeof incomeTxForm>;
export const incomeTxForm = baseTxForm.extend({
  countryCode: z.string(), // Not for mutation
  debitAccountId: z.coerce.string().uuid({ message: 'Please select the account' }),
  creditAccountId: z.coerce.string().uuid({ message: 'Please select the category' }),
});

export type FundTransferTxForm = z.infer<typeof fundTransferTxForm>;
export const fundTransferTxForm = baseTxForm.extend({
  debitAccountId: z.coerce.string().uuid({ message: 'Please select origin account' }),
  creditAccountId: z.coerce.string().uuid({ message: 'Please select destination account' }),
});

const fields = expenseTxForm.keyof().options;
export type FormFieldName = (typeof fields)[number];
