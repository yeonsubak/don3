'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JournalEntrySelect } from '@/db/drizzle/types';
import { getTransactionService } from '@/services/helper';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';
import { toast } from 'sonner';
import { useTransactionContext } from '../transaction-context';
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

  const { setOpen } = useTransactionDrawerContext();
  const {
    calendarDateState: [dates, setDates],
  } = useTransactionContext();

  const t = useTranslations('Entry.Type');

  const onSuccess = async (entry: JournalEntrySelect<{ currency: true; transactions: true }>) => {
    const transactionService = await getTransactionService();
    if (!transactionService) throw new Error('TransactionService must be initialized first');
    const start = DateTime.fromJSDate(entry.date).startOf('month');
    const end = start.endOf('month');
    setDates({ from: start.toJSDate(), to: end.toJSDate() });
    setOpen(false);
    toast.success(`A record has been added: [${t(entry.type)}] ${entry.title}`, {
      position: 'top-center',
    });
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
