'use client';

import { useGlobalContext } from '@/app/app/global-context';
import { useServiceContext } from '@/app/app/service-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JournalEntrySelect } from '@/db/drizzle/types';
import { type ReactNode } from 'react';
import { useTransactionContext } from '../transaction-context';
import { mapToTransactionItems } from '../transaction-record';
import { useTransactionDrawerContext } from './drawer-context';
import { ExpenseForm } from './forms/expense-form';
import { FundTransferForm } from './forms/fund-transfer-form';
import { IncomeForm } from './forms/income-form';

export const TransactionFormTab = ({ footer }: { footer: ReactNode }) => {
  const { defaultCurrency } = useGlobalContext();
  const { setOpen } = useTransactionDrawerContext();
  const {
    calendarDateState: [calendarDate],
    incomeSummaryState: [income, setIncome],
    expenseSummaryState: [expense, setExpense],
    transactionRecordState: [txRecord, setTxRecord],
  } = useTransactionContext();

  const { transactionService } = useServiceContext();

  const onSuccess = async (entry: JournalEntrySelect<{ currency: true; transactions: true }>[]) => {
    if (!transactionService) throw new Error('TransactionService must be initialized first');

    const dateError = new Error('Date must be selected');

    if (!calendarDate) throw dateError;

    const { from, to } = calendarDate;
    if (!from || !to) throw dateError;

    const summary = await transactionService.getSummary(from, to, defaultCurrency!);

    setIncome(summary.income);
    setExpense(summary.expense);

    const txItem = mapToTransactionItems(entry);
    setTxRecord((prev) => [...txItem, ...prev]);

    setOpen(false);
  };

  return (
    <Tabs defaultValue="expense">
      <div className="px-2">
        <TabsList className="w-full">
          <div className="grid w-full grid-flow-col">
            <TabsTrigger value="income" className="grow">
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="grow">
              Expense
            </TabsTrigger>
            <TabsTrigger value="transfer" className="grow">
              Transfer
            </TabsTrigger>
          </div>
        </TabsList>
      </div>
      <TabsContent value="expense">
        <ExpenseForm footer={footer} onSuccess={onSuccess} />
      </TabsContent>
      <TabsContent value="income">
        <IncomeForm footer={footer} onSuccess={onSuccess} />
      </TabsContent>
      <TabsContent value="transfer">
        <FundTransferForm footer={footer} onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
};
