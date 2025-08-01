'use client';

import type {
  AccountGroupSelectAll,
  AccountSelectAll,
  CountrySelect,
  CurrencySelect,
} from '@/db/app-db/drizzle-types';
import { DATASET_COUNTRY } from '@/db/dataset/country';
import { DATASET_CURRENCY_FIAT } from '@/db/dataset/currency';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { QUERIES } from '@/lib/tanstack-queries';
import { useQueries, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as React from 'react';

type GlobalContext = {
  countries: CountrySelect[];
  currencies: CurrencySelect[];
  isMultiCountry: boolean;
  countriesInUse: CountrySelect[];
  currenciesInUse: CurrencySelect[];
  accounts: AccountSelectAll[];

  defaultCountry: CountrySelect;
  defaultCurrency: CurrencySelect;
  defaultLanguage: string;

  accountGroups: AccountGroupSelectAll[];
  setAccountGroups: React.Dispatch<React.SetStateAction<AccountGroupSelectAll[]>>;

  isPending: boolean;

  queryClient: QueryClient;
};

export const GlobalContext = React.createContext<GlobalContext | null>(null);

export const GlobalContextProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const {
    data: {
      fetchedDefaultCurrency,
      fetchedDefaultCountry,
      fetchedCountries,
      fetchedCurrencies,
      fetchedAccountGroups,
    },
    isPending,
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.config.defaultCurrency(),
      QUERIES.config.defaultCountry(),
      QUERIES.config.countries(),
      QUERIES.config.currencies(),
      QUERIES.accounts.allAccountGroups(),
    ],
    combine: (results) => ({
      data: {
        fetchedDefaultCurrency: results[0].data,
        fetchedDefaultCountry: results[1].data,
        fetchedCountries: results[2].data,
        fetchedCurrencies: results[3].data,
        fetchedAccountGroups: results[4].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const defaultCurrency: CurrencySelect = React.useMemo(() => {
    if (fetchedDefaultCurrency) {
      return fetchedDefaultCurrency;
    }

    return DATASET_CURRENCY_FIAT.find(
      (e) => e.code === (localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY) ?? 'USD'),
    ) as CurrencySelect;
  }, [fetchedDefaultCurrency]);

  const defaultCountry: CountrySelect = React.useMemo(() => {
    if (fetchedDefaultCountry) {
      return fetchedDefaultCountry;
    }

    return DATASET_COUNTRY.find(
      (e) => e.code === (localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY) ?? 'USA'),
    ) as CountrySelect;
  }, [fetchedDefaultCountry]);
  const defaultLanguage: string = React.useMemo(() => 'en', []); // TODO: add fetch logic when i8n is supported.

  const countries: CountrySelect<{ defaultCurrency: true }>[] = React.useMemo(
    () => fetchedCountries ?? [],
    [fetchedCountries],
  );
  const currencies: CurrencySelect[] = React.useMemo(
    () => fetchedCurrencies ?? [],
    [fetchedCurrencies],
  );

  const [accountGroups, setAccountGroups] = React.useState<AccountGroupSelectAll[]>([]);
  const accounts = React.useMemo(
    () => accountGroups.flatMap((group) => group.accounts),
    [accountGroups],
  ) as AccountSelectAll[];

  const countriesInUse = React.useMemo(() => {
    const countries = accounts.map((account) => account.country);
    const removeDups = new Map(countries.map((e) => [e.id, e]));
    return Array.from(removeDups.values());
  }, [accounts]);
  const isMultiCountry = React.useMemo(() => countriesInUse.length > 1, [countriesInUse]);

  const currenciesInUse = React.useMemo(() => {
    const currencies = accounts.map((account) => account.currency);
    const removeDups = new Map(currencies.map((e) => [e.id, e]));
    return Array.from(removeDups.values());
  }, [accounts]);

  React.useEffect(() => {
    setAccountGroups(fetchedAccountGroups ?? []);
  }, [fetchedAccountGroups]);

  if (isPending) {
    return <></>;
  }

  if (isError) {
    return error.map((e, i) => <p key={i}>Error: ${e?.message}</p>);
  }

  return (
    <GlobalContext.Provider
      value={{
        countriesInUse,
        currenciesInUse,
        isMultiCountry,
        defaultCountry,
        defaultCurrency,
        defaultLanguage,
        countries,
        currencies,
        accounts,
        accountGroups,
        setAccountGroups,
        isPending,
        queryClient,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = React.useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalContextProvider');
  }
  return context;
};
