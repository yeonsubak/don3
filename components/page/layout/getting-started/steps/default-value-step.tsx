import { CountryCombobox } from '@/components/compositions/country-combobox';
import { CurrencyCombobox } from '@/components/compositions/currency-combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DATASET_COUNTRY } from '@/db/dataset/country';
import { DATASET_CURRENCY_FIAT } from '@/db/dataset/currency';
import { DBInitializer } from '@/db/db-initializer';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const defaultValueForm = z.object({
  countryCode: z.string().min(3).max(3),
  currencyCode: z.string().min(3).max(3),
});

export type DefaultValueForm = z.infer<typeof defaultValueForm>;

export const DefaultValueStep = forwardRef<{ submitForm: () => Promise<void> }, object>(
  (_props, ref) => {
    const lang = navigator.languages.at(0);
    const countryCodeAlpha2 = lang?.substring(3, 5) ?? 'US';
    const defaultCountry = DATASET_COUNTRY.find((e) => e.codeAlpha2 == countryCodeAlpha2);
    const defaultCurrency = DATASET_CURRENCY_FIAT.find(
      (e) => e.id === defaultCountry?.defaultCurrencyId,
    );

    const form = useForm<DefaultValueForm>({
      resolver: zodResolver(defaultValueForm),
      defaultValues: {
        countryCode: defaultCountry?.code ?? 'USA',
        currencyCode: defaultCurrency?.code ?? 'USD',
      },
    });

    async function onSubmit({ countryCode, currencyCode }: DefaultValueForm) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY, countryCode);
      localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY, currencyCode);
      localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_LANGUAGE, 'en');

      if (!DBInitializer.isInitialized) {
        const dbInitializer = await DBInitializer.getInstance();
        await dbInitializer.ensureDbReady();
      }
    }

    useImperativeHandle(ref, () => ({
      submitForm: () => form.handleSubmit(onSubmit)(),
    }));

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 px-4">
          <FormField
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <CountryCombobox mode="all" countries={DATASET_COUNTRY} field={field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currencyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <CurrencyCombobox currencies={DATASET_CURRENCY_FIAT} field={field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
);

DefaultValueStep.displayName = 'DefaultValueStep';
