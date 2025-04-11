'use client';

import { getFirstLastDayInMonth } from '@/components/common-functions';
import type { DateRange } from '@/components/common-types';
import { AddTransactionDrawer } from '@/components/page/transactions/add-drawer';
import { TransactionDrawerContextProvider } from '@/components/page/transactions/add-drawer/drawer-context';
import { TransactionCalendar } from '@/components/page/transactions/transaction-calendar';
import { TransactionRecord } from '@/components/page/transactions/transaction-record';
import { TransactionSummary } from '@/components/page/transactions/transaction-summary';
import { useState } from 'react';

export default function ManageTransactions() {
  const { firstDate, lastDate } = getFirstLastDayInMonth(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({ from: firstDate, to: lastDate });

  return (
    <div className="flex flex-col gap-6">
      <TransactionCalendar />
      <TransactionSummary dateRange={dateRange} setDateRange={setDateRange} />
      <div className="mb-2">
        <TransactionDrawerContextProvider>
          <AddTransactionDrawer />
        </TransactionDrawerContextProvider>
      </div>

      {/* Transaction records */}
      <TransactionRecord />
    </div>
  );
}
