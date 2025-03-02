import { QUERIES } from '@/components/tanstack-queries';
import { Skeleton } from '@/components/ui/skeleton';
import type { CountrySelect, CountrySelectWithRelations, CurrencySelect } from '@/db/drizzle/types';
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
};

export const GlobalContext = createContext<GlobalContext | null>(null);

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: { fetchedCountriesInUse, fetchedDefaultCurrency, fetchedCountries, fetchedCurrencies },
    isPending,
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.config.defaultCurrency,
      QUERIES.config.countriesInUse,
      QUERIES.config.countries,
      QUERIES.config.currencies,
    ],
    combine: (results) => ({
      data: {
        fetchedDefaultCurrency: results[0].data,
        fetchedCountriesInUse: results[1].data,
        fetchedCountries: results[2].data,
        fetchedCurrencies: results[3].data,
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

  useEffect(() => {
    setCountriesInUse(fetchedCountriesInUse ?? []);
    setIsMultiCountry((fetchedCountriesInUse?.length ?? 0) > 1);
    setDefaultCurrency(fetchedDefaultCurrency);
    setCountries(fetchedCountries ?? []);
    setCurrencies(fetchedCurrencies ?? []);
  }, [fetchedCountriesInUse, fetchedDefaultCurrency]);

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
