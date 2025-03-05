import { useGlobalContext } from '@/app/app/global-context';
import type { CountrySelect } from '@/db/drizzle/types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Combobox, type ComboboxItem, type ComboboxProps } from '../primitives/combobox';

export interface CountryComboboxProps extends ComboboxProps {
  mode: 'all' | 'inUse';
}

export const CountryCombobox = ({ mode, ...props }: CountryComboboxProps) => {
  const { countriesInUse, countries } = useGlobalContext();
  const tCountry = useTranslations('countryCode');

  const mapToCountryItems: (countries: CountrySelect[]) => ComboboxItem<CountrySelect>[] = (
    countries,
  ) => {
    const aa = countries.map((country) => ({
      label: tCountry(country.code),
      value: country.code,
      data: country,
    }));

    return aa;
  };

  const [countryItems, setCountryItems] = useState<ComboboxItem<CountrySelect>[]>(
    mode === 'inUse' ? mapToCountryItems(countriesInUse) : mapToCountryItems(countries),
  );

  return (
    <Combobox
      items={countryItems}
      searchable={mode === 'all'}
      popoverContentAlign="start"
      {...props}
    />
  );
};
