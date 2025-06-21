import { getFirstLastDayInMonth } from '@/components/common-functions';
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { DateRange } from 'react-day-picker';
import type { TransactionItem } from './components/transaction-record';

type TransactionContext = {
  incomeSummaryState: [number, Dispatch<SetStateAction<number>>];
  expenseSummaryState: [number, Dispatch<SetStateAction<number>>];
  calendarDateState: [DateRange | undefined, Dispatch<SetStateAction<DateRange | undefined>>];
  transactionRecordState: [TransactionItem[], Dispatch<SetStateAction<TransactionItem[]>>];
};

export const TransactionContext = createContext<TransactionContext | null>(null);

export const TransactionContextProvider = ({ children }: { children: ReactNode }) => {
  const incomeSummaryState = useState<number>(0);
  const expenseSummaryState = useState<number>(0);
  const transactionRecordState = useState<TransactionItem[]>([]);

  const { firstDate, lastDate } = getFirstLastDayInMonth(new Date());

  const calendarDateState = useState<DateRange | undefined>({ from: firstDate, to: lastDate });

  return (
    <TransactionContext.Provider
      value={{
        incomeSummaryState,
        expenseSummaryState,
        calendarDateState,
        transactionRecordState,
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
