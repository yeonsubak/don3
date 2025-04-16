'use client';

import { QUERIES } from '@/lib/tanstack-queries';
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
import { useGlobalContext } from '../global-context';
import type { ForexSelect } from '@/db/drizzle/types';

export type AccountsContextProps = {
  fxRates: ForexSelect[];
};
export const AccountsContext = createContext<AccountsContextProps | null>(null);

export const AccountsContextProvider = ({ children }: { children: ReactNode }) => {
  const { defaultCurrency, currenciesInUse } = useGlobalContext();
  const [fxRates, setFxRates] = useState<ForexSelect[]>([]);

  const { data: fetchedFxRate } = useQuery(
    QUERIES.config.latestFxRate(defaultCurrency, currenciesInUse),
  );
  useEffect(() => {
    if (fetchedFxRate) {
      setFxRates(fetchedFxRate);
    }
  }, [fetchedFxRate]);

  return (
    <AccountsContext.Provider
      value={{
        fxRates,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccountsContext = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccountsContext must be used within a AccountsContextProvider');
  }
  return context;
};
