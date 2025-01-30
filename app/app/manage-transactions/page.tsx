'use client';

import { getFirstLastDayInMonth } from '@/components/common-functions';
import type { DateRange } from '@/components/common-types';
import { AddTransactionDrawer } from '@/components/compositions/manage-transactions/add-transaction-drawer';
import { TransactionDrawerContextProvider } from '@/components/compositions/manage-transactions/add-transaction-drawer/drawer-context';
import { Transaction } from '@/components/compositions/manage-transactions/transaction';
import { TransactionSummary } from '@/components/compositions/manage-transactions/transaction-summary';
import { useState } from 'react';

export default function ManageTransactions() {
  const { firstDate, lastDate } = getFirstLastDayInMonth(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({ from: firstDate, to: lastDate });

  const a = [1, 2, 3, 4];

  return (
    <div className="flex flex-col gap-6 pt-10">
      <TransactionSummary dateRange={dateRange} setDateRange={setDateRange} />
      <div className="flex">
        <TransactionDrawerContextProvider>
          <AddTransactionDrawer />
        </TransactionDrawerContextProvider>
      </div>

      {/* Transaction records */}
      <div className="flex flex-col gap-6">
        <p>1월 19일</p>
        {a.map((e, idx) => (
          <Transaction key={idx} />
        ))}
      </div>
    </div>
  );
}
