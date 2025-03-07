import { useGlobalContext } from '@/app/app/global-context';
import type { CurrencySelect } from '@/db/drizzle/types';
import { useMemo } from 'react';
import { Combobox, type ComboboxProps } from '../primitives/combobox';

const mapToCurrencyItems = (currencies: CurrencySelect[], currenciesInUse: CurrencySelect[]) => {
  const convert = (currencies: CurrencySelect[]) => {
    return currencies.map((currency) => ({
      label: `${currency.symbol} - ${currency.name}`,
      value: currency.code,
      data: currency,
    }));
  };

  const favorite = {
    label: 'Favorite',
    value: 'Favorite',
    children: convert(currenciesInUse ?? []),
  };

  return [favorite, ...convert(currencies ?? [])];
};

export const CurrencyCombobox = ({ ...props }: ComboboxProps) => {
  const { currencies, currenciesInUse } = useGlobalContext();
  const currencyItems = useMemo(
    () => mapToCurrencyItems(currencies, currenciesInUse),
    [currencies, currenciesInUse],
  );

  return (
    <Combobox
      items={currencyItems}
      searchable
      popoverContentAlign="start"
      placeholder="Select currency..."
      searchPlaceholder="Search currency..."
      notFoundPlaceholder="No currency found."
      {...props}
    />
  );
};
