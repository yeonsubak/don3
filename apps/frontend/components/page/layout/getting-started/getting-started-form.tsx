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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { defaultConfigForm, type DefaultConfigForm } from './form-schema';
import { Button } from '@/components/ui/button';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

export const GettingStartedForm = ({ posthook }: { posthook: () => void }) => {
  const lang = navigator.languages.at(0);
  const countryCodeAlpha2 = lang?.substring(3, 5) ?? 'US';
  const defaultCountry = DATASET_COUNTRY.find((e) => e.codeAlpha2 == countryCodeAlpha2);
  const defaultCurrency = DATASET_CURRENCY_FIAT.find(
    (e) => e.id === defaultCountry?.defaultCurrencyId,
  );

  const form = useForm<DefaultConfigForm>({
    resolver: zodResolver(defaultConfigForm),
    defaultValues: {
      countryCode: defaultCountry?.code ?? 'USA',
      currencyCode: defaultCurrency?.code ?? 'USD',
    },
  });

  function onSubmit({ countryCode, currencyCode }: DefaultConfigForm) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY, countryCode);
    localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY, currencyCode);
    localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_LANGUAGE, 'en');
    posthook();
  }

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
                <CountryCombobox
                  mode="all"
                  countries={DATASET_COUNTRY}
                  field={field}
                  zForm={form}
                />
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
                <CurrencyCombobox currencies={DATASET_CURRENCY_FIAT} field={field} zForm={form} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="mt-2 flex justify-end">
          <Button>Save</Button>
        </div>
      </form>
    </Form>
  );
};
