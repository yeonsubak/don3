'use client';

import { Calendar } from '@/components/compositions/calendar';
import { useTransactionContext } from './transaction-context';
import { TransactionSummary } from './components/transaction-summary';
import { TransactionDrawer } from './components/drawer';
import { TransactionRecord } from './components/transaction-record';

export default function TransactionPage() {
  const { calendarDateState } = useTransactionContext();

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <Calendar dateState={calendarDateState} />
      <TransactionSummary>
        <TransactionDrawer />
      </TransactionSummary>
      <div className="mb-2"></div>

      {/* Transaction records */}
      <TransactionRecord />
    </div>
  );
}
