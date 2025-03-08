import { useGlobalContext } from '@/app/app/global-context';
import type { CurrencySelect } from '@/db/drizzle/types';
import { useMemo } from 'react';
import { Combobox, flattenComboboxItems, type ComboboxProps } from '../primitives/combobox';

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

  const otherCurrencies = {
    label: 'Other currencies',
    value: 'Other currencies',
    children: convert(
      currencies.filter((currency) => {
        const inUseIds = currenciesInUse.map((e) => e.id);
        return !inUseIds.includes(currency.id);
      }),
    ),
  };

  return [favorite, otherCurrencies];
};

interface CurrencyComboboxProps extends ComboboxProps {
  buttonRenderMode?: 'normal' | 'symbol';
}

export const CurrencyCombobox = ({
  field,
  buttonRenderMode = 'normal',
  ...props
}: CurrencyComboboxProps) => {
  const { currencies, currenciesInUse } = useGlobalContext();
  const currencyItems = useMemo(
    () => mapToCurrencyItems(currencies, currenciesInUse),
    [currencies, currenciesInUse],
  );

  if (buttonRenderMode === 'symbol') {
    return (
      <Combobox
        items={currencyItems}
        buttonLabelRenderFn={() => {
          const currencies = flattenComboboxItems<CurrencySelect>(currencyItems);
          const currency = currencies.find((currency) => currency.value === field?.value);
          return currency?.label.split('-').map((e) => e.trim())[0] ?? '';
        }}
        isChevron={false}
        popoverButtonClass="min-w-[3.25rem] w-fit justify-center"
        popoverContentClass="w-80"
        field={field}
        {...props}
      />
    );
  }

  return (
    <Combobox
      items={currencyItems}
      searchable
      popoverContentAlign="start"
      placeholder="Select currency..."
      searchPlaceholder="Search currency..."
      notFoundPlaceholder="No currency found."
    />
  );
};
