import type { CurrencyInsert, CurrencySelect } from '@/db/drizzle/types';
import { useMemo } from 'react';
import { Combobox, flattenComboboxItems, type ComboboxProps } from '../primitives/combobox';

interface CurrencyComboboxProps extends ComboboxProps {
  buttonRenderMode?: 'normal' | 'symbol';
  currencies: CurrencySelect[] | CurrencyInsert[];
  currenciesInUse?: CurrencySelect[];
}

export const CurrencyCombobox = ({
  field,
  buttonRenderMode = 'normal',
  currencies,
  currenciesInUse,
  ...props
}: CurrencyComboboxProps) => {
  function mapToCurrencyItems(currencies: CurrencySelect[]) {
    return currencies.map((currency) => ({
      label: `${currency.symbol} - ${currency.name}`,
      value: currency.code,
      data: currency,
    }));
  }

  const currencyItems = useMemo(() => {
    const favorite = currenciesInUse
      ? {
          label: 'Favorite',
          value: 'Favorite',
          children: mapToCurrencyItems(currenciesInUse ?? []),
        }
      : null;

    const others = currencies.filter((currency) => {
      const inUseIds = currenciesInUse?.map((e) => e.id) ?? [];
      return !inUseIds.includes(currency.id!);
    });

    const otherCurrencies = {
      label: 'Other currencies',
      value: 'Other currencies',
      children: mapToCurrencyItems(others as CurrencySelect[]),
    };

    return favorite ? [favorite, otherCurrencies] : otherCurrencies.children;
  }, [currencies, currenciesInUse]);

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
      field={field}
      {...props}
    />
  );
};
