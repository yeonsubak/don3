'use client';

import { Calendar } from '@/components/compositions/calendar';
import { TransactionDrawer } from '@/components/page/transactions/drawer';
import { useTransactionContext } from '@/components/page/transactions/transaction-context';
import { TransactionRecord } from '@/components/page/transactions/transaction-record';
import { TransactionSummary } from '@/components/page/transactions/transaction-summary';

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
