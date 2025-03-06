import { QUERIES } from '@/components/tanstack-queries';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  AccountSelectWithRelations,
  CountrySelect,
  CountrySelectWithRelations,
  CurrencySelect,
} from '@/db/drizzle/types';
import { useQueries } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type GlobalContext = {
  countriesInUse: CountrySelectWithRelations[];
  setCountriesInUse: Dispatch<SetStateAction<CountrySelectWithRelations[]>>;
  isMultiCountry: boolean;
  setIsMultiCountry: Dispatch<SetStateAction<boolean>>;
  defaultCurrency: CurrencySelect | undefined;
  setDefaultCurrency: Dispatch<SetStateAction<CurrencySelect | undefined>>;
  defaultLanguage: string;
  setDefaultLanguage: Dispatch<SetStateAction<string>>;
  countries: CountrySelect[];
  currencies: CurrencySelect[];
  accounts: AccountSelectWithRelations[];
  setAccounts: Dispatch<SetStateAction<AccountSelectWithRelations[]>>;
};

export const GlobalContext = createContext<GlobalContext | null>(null);

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: {
      fetchedCountriesInUse,
      fetchedDefaultCurrency,
      fetchedCountries,
      fetchedCurrencies,
      fetchedAccounts,
    },
    isPending,
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.config.defaultCurrency,
      QUERIES.config.countriesInUse,
      QUERIES.config.countries,
      QUERIES.config.currencies,
      QUERIES.accounts.getAllAccounts,
    ],
    combine: (results) => ({
      data: {
        fetchedDefaultCurrency: results[0].data,
        fetchedCountriesInUse: results[1].data,
        fetchedCountries: results[2].data,
        fetchedCurrencies: results[3].data,
        fetchedAccounts: results[4].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const [countriesInUse, setCountriesInUse] = useState<CountrySelectWithRelations[]>([]);
  const [isMultiCountry, setIsMultiCountry] = useState<boolean>(false);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencySelect | undefined>();
  const [defaultLanguage, setDefaultLanguage] = useState<string>('en');
  const [countries, setCountries] = useState<CountrySelect[]>([]);
  const [currencies, setCurrencies] = useState<CurrencySelect[]>([]);
  const [accounts, setAccounts] = useState<AccountSelectWithRelations[]>([]);

  useEffect(() => {
    setCountriesInUse(fetchedCountriesInUse ?? []);
    setIsMultiCountry((fetchedCountriesInUse?.length ?? 0) > 1);
    setDefaultCurrency(fetchedDefaultCurrency);
    setCountries(fetchedCountries ?? []);
    setCurrencies(fetchedCurrencies ?? []);
    setAccounts(fetchedAccounts ?? []);
  }, [
    fetchedCountries,
    fetchedCountriesInUse,
    fetchedDefaultCurrency,
    fetchedCurrencies,
    fetchedAccounts,
  ]);

  if (isPending) {
    return <Skeleton className="h-full w-full" />;
  }

  if (isError) {
    return error.map((e, i) => <p key={i}>Error: ${e?.message}</p>);
  }

  return (
    <GlobalContext.Provider
      value={{
        countriesInUse,
        setCountriesInUse,
        isMultiCountry,
        setIsMultiCountry,
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
