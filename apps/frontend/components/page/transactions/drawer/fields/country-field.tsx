import { useGlobalContext } from '@/app/app/global-context';
import type { ZForm } from '@/components/common-types';
import { CountryCombobox } from '@/components/compositions/country-combobox';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

export const CountryField = ({ zForm }: { zForm: ZForm }) => {
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
              onSelectFn={(currentValue) => {
                const currencyCode = defaultCurrency?.code ?? 'USD';
                field.onChange(currencyCode);
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
