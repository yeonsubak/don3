'use client';

import { useGlobalContext } from '@/app/app/global-context';
import type { ComboboxItem } from '@/components/primitives/combobox';
import { QUERIES } from '@/components/tanstack-queries';
import { Skeleton } from '@/components/ui/skeleton';
import type { CurrencySelect } from '@/db/drizzle/types';
import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

export type TransactionDrawerContext = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  currencies: CurrencySelect[];
  currencyComboItems: ComboboxItem<CurrencySelect>[];
};
export const TransactionDrawerContext = createContext<TransactionDrawerContext | null>(null);

export const TransactionDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { currencies } = useGlobalContext();
  const [currencyComboItems, setCurrencyComboItems] = useState<ComboboxItem<CurrencySelect>[]>([]);
  const { defaultCurrency } = useGlobalContext();

  const {
    data: currenciesInUseData,
    isPending,
    isError,
    error,
  } = useQuery(QUERIES.config.currenciesInUse);

  useEffect(() => {
    setCurrencyComboItems(() => {
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
        children: convert(currenciesInUseData ?? []),
      };
      return [favorite, ...convert(currencies ?? [])];
    });
    // setSelectedCurrency(defaultCurrency);
  }, [currencies, currenciesInUseData, defaultCurrency]);

  if (isPending) {
    return <Skeleton className="h-full w-full" />;
  }

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <TransactionDrawerContext.Provider
      value={{
        open,
        setOpen,
        currencies,
        currencyComboItems,
      }}
    >
      {children}
    </TransactionDrawerContext.Provider>
  );
};

export const useTransactionDrawerContext = () => {
  const context = useContext(TransactionDrawerContext);
  if (!context) {
    throw new Error(
      'useTransactionDrawerContext must be used within a TransactionDrawerContextProvider',
    );
  }
  return context;
};
