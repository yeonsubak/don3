'use client';

import { useGlobalContext } from '@/app/app/global-context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JournalEntrySelect } from '@/db/drizzle/types';
import { getTransactionService } from '@/services/helper';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';
import { toast } from 'sonner';
import { useTransactionContext } from '../transaction-context';
import { mapToTransactionItems } from '../transaction-record';
import { useTransactionDrawerContext } from './drawer-context';
import { ExpenseForm } from './forms/expense-form';
import { FundTransferForm } from './forms/fund-transfer-form';
import { IncomeForm } from './forms/income-form';

export const TransactionFormTab = ({ footer }: { footer?: ReactNode }) => {
  if (!footer) {
    footer = (
      <Button type="submit" variant="default" disableOnProcess>
        Save
      </Button>
    );
  }

  const { defaultCurrency } = useGlobalContext();
  const { setOpen } = useTransactionDrawerContext();
  const {
    calendarDateState: [calendarDate],
    incomeSummaryState: [income, setIncome],
    expenseSummaryState: [expense, setExpense],
    transactionRecordState: [txRecord, setTxRecord],
  } = useTransactionContext();

  const t = useTranslations('Entry.Type');

  const onSuccess = async (entry: JournalEntrySelect<{ currency: true; transactions: true }>) => {
    const transactionService = await getTransactionService();
    if (!transactionService) throw new Error('TransactionService must be initialized first');

    const dateError = new Error('Date must be selected');

    if (!calendarDate) throw dateError;

    const { from, to } = calendarDate;
    if (!from || !to) throw dateError;

    const summary = await transactionService.getSummary(from, to, defaultCurrency!);

    setIncome(summary.income);
    setExpense(summary.expense);

    const txItem = mapToTransactionItems([entry]);
    setTxRecord((prev) => [...txItem, ...prev]);

    toast.success(
      <div>
        <h3 className="font-bold">A record has been added.</h3>
        <span>{`[${t(entry.type)}] ${entry.title}`}</span>
      </div>,
      { position: 'top-center' },
    );

    setOpen(false);
  };

  return (
    <Tabs defaultValue="expense">
      <div className="px-4">
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
