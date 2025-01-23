import { QUERIES } from '@/components/tanstack-queries';
import { Skeleton } from '@/components/ui/skeleton';
import type { CountrySelect } from '@/db/drizzle/types';
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
  countriesInUse: CountrySelect[];
  setCountriesInUse: Dispatch<SetStateAction<CountrySelect[]>>;
  isMultiCountry: boolean;
  setIsMultiCountry: Dispatch<SetStateAction<boolean>>;
};

export const GlobalContext = createContext<GlobalContext | null>(null);

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const { data: isDbReady } = useQuery(QUERIES.initializeIndexedDb);
  const {
    isPending,
    isError,
    error,
    data: fetchedCountriesInUse,
  } = useQuery({ ...QUERIES.countriesInUse, enabled: isDbReady });

  const [countriesInUse, setCountriesInUse] = useState<CountrySelect[]>([]);
  const [isMultiCountry, setIsMultiCountry] = useState<boolean>(false);

  useEffect(() => {
    setCountriesInUse(fetchedCountriesInUse ?? []);
    setIsMultiCountry((fetchedCountriesInUse?.length ?? 0) > 1);
  }, [fetchedCountriesInUse]);

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
