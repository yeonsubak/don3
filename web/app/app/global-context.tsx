import { QUERIES } from '@/components/tanstack-queries';
import { Skeleton } from '@/components/ui/skeleton';
import type { CountrySelectWithRelations, CurrencySelect } from '@/db/drizzle/types';
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

type GlobalContext = {
  countriesInUse: CountrySelectWithRelations[];
  setCountriesInUse: Dispatch<SetStateAction<CountrySelectWithRelations[]>>;
  isMultiCountry: boolean;
  setIsMultiCountry: Dispatch<SetStateAction<boolean>>;
  defaultCurrency: CurrencySelect | undefined;
  setDefaultCurrency: Dispatch<SetStateAction<CurrencySelect | undefined>>;
};

export const GlobalContext = createContext<GlobalContext | null>(null);

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const { data: fetchedDefaultCurrency } = useQuery(QUERIES.config.defaultCurrency);
  const {
    isPending,
    isError,
    error,
    data: fetchedCountriesInUse,
  } = useQuery(QUERIES.config.countriesInUse);

  const [countriesInUse, setCountriesInUse] = useState<CountrySelectWithRelations[]>([]);
  const [isMultiCountry, setIsMultiCountry] = useState<boolean>(false);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencySelect | undefined>();

  useEffect(() => {
    setCountriesInUse(fetchedCountriesInUse ?? []);
    setIsMultiCountry((fetchedCountriesInUse?.length ?? 0) > 1);
    setDefaultCurrency(fetchedDefaultCurrency);
  }, [fetchedCountriesInUse, fetchedDefaultCurrency]);

  if (isPending) {
    return <Skeleton className="h-full w-full" />;
  }

  if (isError) {
    return <p>Error: {error.message}</p>;
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
