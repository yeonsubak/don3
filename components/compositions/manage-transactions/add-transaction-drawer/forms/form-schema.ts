import { parseNumber } from '@/components/common-functions';
import schema from '@/db/drizzle/schema';
import { z } from 'zod';

const { journalEntryTypeEnum } = schema;

export const baseForm = z.object({
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
  title: z.string(),
  description: z.string(),
  countryCode: z.string(), // Not for mutation
  isFx: z.boolean().default(false), // Not for mutation
});

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

export type ExpenseTxForm = z.infer<typeof expenseTxForm>;
export const expenseTxForm = baseForm
  .extend({
    debitAccountId: z.coerce.number().gt(0, { message: "Please select 'Paid by' account" }),
    creditAccountId: z.coerce.number().gt(0, { message: 'Please select the category' }),
  })
  .refine(validateFxRate, fxRateErrorMsg);

export type IncomeTxForm = z.infer<typeof incomeTxForm>;
export const incomeTxForm = baseForm
  .extend({
    debitAccountId: z.coerce.number().gt(0, { message: 'Please select the account' }),
    creditAccountId: z.coerce.number().gt(0, { message: 'Please select the category' }),
  })
  .refine(validateFxRate, fxRateErrorMsg);
