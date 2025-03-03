'use client';

import { getFirstLastDayInMonth } from '@/components/common-functions';
import type { DateRange } from '@/components/common-types';
import { AddTransactionDrawer } from '@/components/compositions/manage-transactions/add-transaction-drawer';
import { TransactionDrawerContextProvider } from '@/components/compositions/manage-transactions/add-transaction-drawer/drawer-context';
import { TransactionCalendar } from '@/components/compositions/manage-transactions/transaction-calendar';
import { TransactionRecord } from '@/components/compositions/manage-transactions/transaction-record';
import { TransactionSummary } from '@/components/compositions/manage-transactions/transaction-summary';
import { useState } from 'react';
import { TransactionContextProvider } from '../../../components/compositions/manage-transactions/transaction-context';

export default function ManageTransactions() {
  const { firstDate, lastDate } = getFirstLastDayInMonth(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({ from: firstDate, to: lastDate });

  return (
    <TransactionContextProvider>
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
    </TransactionContextProvider>
  );
}
