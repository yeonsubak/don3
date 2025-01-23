'use client';

import { AddTransactionDrawer } from '@/components/compositions/manage-transactions/add-transaction-drawer';
import { TransactionDrawerContextProvider } from '@/components/compositions/manage-transactions/add-transaction-drawer/drawer-context';
import { Transaction } from '@/components/compositions/manage-transactions/transaction';

export default function ManageTransactions() {
  const a = [1, 2, 3, 4];

  return (
    <div className="flex flex-col gap-3">
      <div className="font-semibold">
        <div className="flex flex-row gap-8 text-xl">
          <p className="grow text-left">Income</p>
          <p className="grow text-right text-blue-600">₩ 1,800,000</p>
        </div>
        <div className="flex flex-row gap-8 text-xl">
          <p className="grow text-left">Expense</p>
          <p className="grow text-right text-rose-600">-645,000</p>
        </div>
        <div className="flex flex-row gap-8 text-xl">
          <p className="grow-0"></p>
          <p className="grow text-right text-blue-600">1,155,000</p>
        </div>
      </div>
      <div className="flex flex-row-reverse">
        <TransactionDrawerContextProvider>
          <AddTransactionDrawer />
        </TransactionDrawerContextProvider>
      </div>

      {/* Transaction records */}
      <div className="flex flex-col gap-2">
        <p>1월 19일</p>
        {a.map((e, idx) => (
          <Transaction key={idx} />
        ))}
      </div>
    </div>
  );
}
