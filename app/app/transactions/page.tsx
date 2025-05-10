'use client';

import { AddTransactionDrawer } from '@/components/page/transactions/add-drawer';
import { TransactionDrawerContextProvider } from '@/components/page/transactions/add-drawer/drawer-context';
import { TransactionCalendar } from '@/components/page/transactions/transaction-calendar';
import { TransactionRecord } from '@/components/page/transactions/transaction-record';
import { TransactionSummary } from '@/components/page/transactions/transaction-summary';

export default function TransactionPage() {
  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <TransactionCalendar />
      <TransactionSummary>
        <TransactionDrawerContextProvider>
          <AddTransactionDrawer />
        </TransactionDrawerContextProvider>
      </TransactionSummary>
      <div className="mb-2"></div>

      {/* Transaction records */}
      <TransactionRecord />
    </div>
  );
}
