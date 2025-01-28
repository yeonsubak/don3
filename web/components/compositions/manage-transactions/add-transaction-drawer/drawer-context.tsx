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

type TransactionDrawerContext = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  currencies: CurrencySelect[];
  currencyComboItems: ComboboxItem<CurrencySelect>[];
  selectedCurrency: CurrencySelect | undefined;
  setSelectedCurrency: Dispatch<SetStateAction<CurrencySelect | undefined>>;
};
export const TransactionDrawerContext = createContext<TransactionDrawerContext | null>(null);

export const TransactionDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [currencies, setCurrencies] = useState<CurrencySelect[]>([]);
  const [currencyComboItems, setCurrencyComboItems] = useState<ComboboxItem<CurrencySelect>[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencySelect | undefined>();
  const { defaultCurrency } = useGlobalContext();

  const { isPending, isError, error, data: currencyData } = useQuery(QUERIES.config.currencies);
  const { data: currenciesInUseData } = useQuery(QUERIES.config.currenciesInUse);

  useEffect(() => {
    setCurrencies(currencyData ?? []);
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
      return [favorite, ...convert(currencyData ?? [])];
    });
    // setSelectedCurrency(defaultCurrency);
  }, [currencyData, currenciesInUseData, defaultCurrency]);

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
        selectedCurrency,
        setSelectedCurrency,
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
