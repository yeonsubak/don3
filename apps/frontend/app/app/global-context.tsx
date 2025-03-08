import type { AccountSelectAll, CountrySelect, CurrencySelect } from '@/db/drizzle/types';
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

  defaultCurrency: CurrencySelect | undefined;
  setDefaultCurrency: Dispatch<SetStateAction<CurrencySelect | undefined>>;

  defaultLanguage: string;
  setDefaultLanguage: Dispatch<SetStateAction<string>>;

  accounts: AccountSelectAll[];
  setAccounts: Dispatch<SetStateAction<AccountSelectAll[]>>;
};

export const GlobalContext = createContext<GlobalContext | null>(null);

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: { fetchedDefaultCurrency, fetchedCountries, fetchedCurrencies, fetchedAccounts },
    isPending,
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.config.defaultCurrency(),
      QUERIES.config.countries(),
      QUERIES.config.currencies(),
      QUERIES.accounts.allAccounts(),
    ],
    combine: (results) => ({
      data: {
        fetchedDefaultCurrency: results[0].data,
        fetchedCountries: results[1].data,
        fetchedCurrencies: results[2].data,
        fetchedAccounts: results[3].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const [defaultCurrency, setDefaultCurrency] = useState<CurrencySelect | undefined>();
  const [defaultLanguage, setDefaultLanguage] = useState<string>('en');
  const [countries, setCountries] = useState<CountrySelect<{ defaultCurrency: true }>[]>([]);
  const [currencies, setCurrencies] = useState<CurrencySelect[]>([]);
  const [accounts, setAccounts] = useState<AccountSelectAll[]>([]);

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
    setAccounts(fetchedAccounts ?? []);
  }, [fetchedCountries, fetchedDefaultCurrency, fetchedCurrencies, fetchedAccounts]);

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
        defaultCurrency,
        setDefaultCurrency,
        defaultLanguage,
        setDefaultLanguage,
        countries,
        currencies,
        accounts,
        setAccounts,
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
