import { DateTime } from 'luxon';
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { DateRange } from 'react-day-picker';

type TransactionContext = {
  incomeSummaryState: [number, Dispatch<SetStateAction<number>>];
  expenseSummaryState: [number, Dispatch<SetStateAction<number>>];
  calendarDateState: [DateRange | undefined, Dispatch<SetStateAction<DateRange | undefined>>];
};

export const TransactionContext = createContext<TransactionContext | null>(null);

export const TransactionContextProvider = ({ children }: { children: ReactNode }) => {
  const incomeSummaryState = useState<number>(0);
  const expenseSummaryState = useState<number>(0);

  const now = DateTime.now();

  const calendarDateState = useState<DateRange | undefined>({
    from: now.startOf('month').toJSDate(),
    to: now.endOf('month').toJSDate(),
  });

  return (
    <TransactionContext.Provider
      value={{
        incomeSummaryState,
        expenseSummaryState,
        calendarDateState,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionContext must be used within a TransactionContextProvider');
  }
  return context;
};
