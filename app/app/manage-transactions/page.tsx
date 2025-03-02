'use client';

import { getFirstLastDayInMonth } from '@/components/common-functions';
import type { DateRange } from '@/components/common-types';
import { AddTransactionDrawer } from '@/components/compositions/manage-transactions/add-transaction-drawer';
import { TransactionDrawerContextProvider } from '@/components/compositions/manage-transactions/add-transaction-drawer/drawer-context';
import {
  Transaction,
  type TransactionItem,
} from '@/components/compositions/manage-transactions/transaction';
import { TransactionCalendar } from '@/components/compositions/manage-transactions/transaction-calendar';
import { TransactionSummary } from '@/components/compositions/manage-transactions/transaction-summary';
import { useState } from 'react';

export default function ManageTransactions() {
  const { firstDate, lastDate } = getFirstLastDayInMonth(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({ from: firstDate, to: lastDate });

  const MOCK_DATA: TransactionItem[] = [
    {
      id: 1,
      title: 'Apple Stoaboutre Purchase',
      currencySymbol: '$',
      amount: 999.0,
      type: 'outgoing',
      category: 'shopping',
      icon: 'shopping-cart',
      date: new Date('2025-02-15T14:45:00'),
    },
    {
      id: 2,
      title: 'Salary Deposit',
      currencySymbol: '$',
      amount: 4500.0,
      type: 'incoming',
      category: 'income',
      icon: 'wallet',
      date: new Date('2025-02-19T09:00:00'),
    },
    {
      id: 3,
      title: 'Netflix Subscription',
      currencySymbol: '$',
      amount: 15.99,
      type: 'outgoing',
      category: 'entertainment',
      icon: 'credit-card',
      date: new Date('2025-02-18T10:00:00'),
    },
    {
      id: 4,
      title: 'Grocery Shopping',
      currencySymbol: '$',
      amount: 85.5,
      type: 'outgoing',
      category: 'food',
      icon: 'shopping-cart',
      date: new Date('2025-02-20T16:30:00'),
    },
    {
      id: 5,
      title: 'Freelance Payment',
      currencySymbol: '$',
      amount: 750.0,
      type: 'incoming',
      category: 'income',
      icon: 'wallet',
      date: new Date('2025-02-22T11:15:00'),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <TransactionCalendar />
      <TransactionSummary dateRange={dateRange} setDateRange={setDateRange} />
      <div className="flex">
        <TransactionDrawerContextProvider>
          <AddTransactionDrawer />
        </TransactionDrawerContextProvider>
      </div>

      {/* Transaction records */}
      <Transaction items={MOCK_DATA} />
    </div>
  );
}
