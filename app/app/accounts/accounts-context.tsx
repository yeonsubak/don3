'use client';

import { getFirstLastDayInMonth } from '@/components/common-functions';
import type { ForexSelect } from '@/db/drizzle/types';
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
import type { DateRange } from 'react-day-picker';
import { useGlobalContext } from '../global-context';

type AccountsContextProps = {
  fxRates: ForexSelect[];
  calendarDate: DateRange | undefined;
  setCalendarDate: Dispatch<SetStateAction<DateRange | undefined>>;
};

const AccountsContext = createContext<AccountsContextProps | null>(null);

export const AccountsContextProvider = ({ children }: { children: ReactNode }) => {
  const { currenciesInUse } = useGlobalContext();
  const [fxRates, setFxRates] = useState<ForexSelect[]>([]);

  const { firstDate, lastDate } = getFirstLastDayInMonth(new Date());
  const [calendarDate, setCalendarDate] = useState<DateRange | undefined>({
    from: firstDate,
    to: lastDate,
  });

  const { data: fetchedFxRate } = useQuery(
    QUERIES.config.latestFxRate(currenciesInUse, currenciesInUse),
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
        calendarDate,
        setCalendarDate,
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
