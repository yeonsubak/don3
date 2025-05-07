import { useGlobalContext } from '@/app/app/global-context';
import {
  CountryCombobox,
  type CountryComboboxProps,
} from '@/components/compositions/country-combobox';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

export const CountryField = ({ zForm }: Partial<CountryComboboxProps>) => {
  const { defaultCurrency, countries, countriesInUse } = useGlobalContext();

  return (
    <FormField
      control={zForm?.control}
      name="countryCode"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Country</FormLabel>
          <FormControl>
            <CountryCombobox
              mode="inUse"
              countries={countries}
              countriesInUse={countriesInUse}
              field={field}
              zForm={zForm}
              onSelectFn={(currentValue) => {
                const currencyCode = defaultCurrency?.code ?? 'USD';
                zForm?.setValue('currencyCode', currencyCode);
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
