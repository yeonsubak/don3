import { z } from 'zod';

export const defaultConfigForm = z.object({
  countryCode: z.string().min(3).max(3),
  currencyCode: z.string().min(3).max(3),
});

export type DefaultConfigForm = z.infer<typeof defaultConfigForm>;
