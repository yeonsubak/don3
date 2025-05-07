import type { CountryInsert, CountrySelect } from '@/db/drizzle/types';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Combobox, type ComboboxItem, type ComboboxProps } from '../primitives/combobox';

export interface CountryComboboxProps extends ComboboxProps {
  mode: 'all' | 'inUse';
  countries: CountrySelect[] | CountryInsert[];
  countriesInUse?: CountrySelect[];
}

export const CountryCombobox = ({
  mode,
  countries,
  countriesInUse,
  ...props
}: CountryComboboxProps) => {
  const tCountry = useTranslations('countryCode');

  const countryItems = useMemo(() => {
    function mapToCountryItems(countries: CountrySelect[]): ComboboxItem<CountrySelect>[] {
      return countries.map((country) => ({
        label: tCountry(country.code),
        value: country.code,
        data: country,
      }));
    }

    if (mode === 'inUse') {
      if (!countriesInUse) {
        throw Error('You must not pass countries props to render only countriesinUse');
      }

      return mapToCountryItems(countriesInUse);
    }

    const favorite = countriesInUse
      ? {
          label: 'Favorite',
          value: 'Favorite',
          children: mapToCountryItems(countriesInUse),
        }
      : null;

    const others = countries.filter((country) => {
      const inUseIds = countriesInUse?.map((e) => e.id) ?? [];
      return !inUseIds.includes(country.id!);
    });

    const otherCountries = {
      label: 'Other countries',
      value: 'Other countries',
      children: mapToCountryItems(others as CountrySelect[]),
    };

    return favorite ? [favorite, otherCountries] : otherCountries.children;
  }, [countries, countriesInUse, mode, tCountry]);

  return (
    <Combobox
      items={countryItems}
      searchable={mode === 'all'}
      popoverContentAlign="start"
      placeholder="Select country..."
      searchPlaceholder="Search country..."
      notFoundPlaceholder="No country found."
      {...props}
    />
  );
};
