import { DATASET_COUNTRY } from '@/db/dataset/country';
import { DATASET_CURRENCY_FIAT } from '@/db/dataset/currency';
import type {
  AccountGroupSelectAll,
  AccountSelectAll,
  CountrySelect,
  CurrencySelect,
} from '@/db/drizzle/types';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { QUERIES } from '@/lib/tanstack-queries';
import { useQueries } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type GlobalContext = {
  countries: CountrySelect[];
  currencies: CurrencySelect[];
  isMultiCountry: boolean;
  countriesInUse: CountrySelect[];
  currenciesInUse: CurrencySelect[];
  accounts: AccountSelectAll[];

  defaultCountry: CountrySelect;
  setDefaultCountry: Dispatch<SetStateAction<CountrySelect>>;

  defaultCurrency: CurrencySelect;
  setDefaultCurrency: Dispatch<SetStateAction<CurrencySelect>>;

  defaultLanguage: string;
  setDefaultLanguage: Dispatch<SetStateAction<string>>;

  accountGroups: AccountGroupSelectAll[];
  setAccountGroups: Dispatch<SetStateAction<AccountGroupSelectAll[]>>;
};

export const GlobalContext = createContext<GlobalContext | null>(null);

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const currencyFallback = DATASET_CURRENCY_FIAT.find(
    (e) => e.code === (localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY) ?? 'USD'),
  ) as CurrencySelect;
  const countryFallback = DATASET_COUNTRY.find(
    (e) => e.code === (localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY) ?? 'USA'),
  ) as CountrySelect;

  const {
    data: { fetchedDefaultCurrency, fetchedCountries, fetchedCurrencies, fetchedAccountGroups },
    isPending,
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.config.defaultCurrency(),
      QUERIES.config.countries(),
      QUERIES.config.currencies(),
      QUERIES.accounts.allAccountGroups(),
    ],
    combine: (results) => ({
      data: {
        fetchedDefaultCurrency: results[0].data ?? currencyFallback,
        fetchedCountries: results[1].data,
        fetchedCurrencies: results[2].data,
        fetchedAccountGroups: results[3].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const [defaultCurrency, setDefaultCurrency] = useState<CurrencySelect>(currencyFallback);
  const [defaultCountry, setDefaultCountry] = useState<CountrySelect>(countryFallback);
  const [defaultLanguage, setDefaultLanguage] = useState<string>('en');
  const [countries, setCountries] = useState<CountrySelect<{ defaultCurrency: true }>[]>([]);
  const [currencies, setCurrencies] = useState<CurrencySelect[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroupSelectAll[]>([]);

  const accounts = useMemo(
    () => accountGroups.flatMap((group) => group.accounts),
    [accountGroups],
  ) as AccountSelectAll[];

  const countriesInUse = useMemo(() => {
    const countries = accounts.map((account) => account.country);
    const removeDups = new Map(countries.map((e) => [e.id, e]));
    return Array.from(removeDups.values());
  }, [accounts]);
  const isMultiCountry = useMemo(() => countriesInUse.length > 1, [countriesInUse]);

  const currenciesInUse = useMemo(() => {
    const currencies = accounts.map((account) => account.currency);
    const removeDups = new Map(currencies.map((e) => [e.id, e]));
    return Array.from(removeDups.values());
  }, [accounts]);

  useEffect(() => {
    setDefaultCurrency(fetchedDefaultCurrency);
    setCountries(fetchedCountries ?? []);
    setCurrencies(fetchedCurrencies ?? []);
    setAccountGroups(fetchedAccountGroups ?? []);
  }, [fetchedCountries, fetchedDefaultCurrency, fetchedCurrencies, fetchedAccountGroups]);

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
        setDefaultCountry,
        defaultCurrency,
        setDefaultCurrency,
        defaultLanguage,
        setDefaultLanguage,
        countries,
        currencies,
        accounts,
        accountGroups,
        setAccountGroups,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalContextProvider');
  }
  return context;
};
