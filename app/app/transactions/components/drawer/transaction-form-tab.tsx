'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JournalEntryType } from '@/db/drizzle/types';
import { getTransactionService } from '@/services/service-helpers';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useTransactionContext } from '../../transaction-context';
import { useTransactionDrawerContext } from '../../transaction-drawer-context';
import { ExpenseForm } from './forms/expense-form';
import type { ExpenseTxForm, FundTransferTxForm, IncomeTxForm } from './forms/form-schema';
import { FundTransferForm } from './forms/fund-transfer-form';
import { IncomeForm } from './forms/income-form';

export const TransactionFormTab = () => {
  const { selectedTab, setSelectedTab, mode, setIsProcessing, onClose } =
    useTransactionDrawerContext();
  const {
    calendarDateState: [dates, setDates],
  } = useTransactionContext();

  const t = useTranslations('Entry.Type');

  function handleTabChange(tabValue: string) {
    setSelectedTab(tabValue as JournalEntryType);
  }

  async function onSubmit(form: ExpenseTxForm | IncomeTxForm | FundTransferTxForm) {
    setIsProcessing(true);
    try {
      const transactionService = await getTransactionService();
      if (!transactionService) throw new Error('TransactionService must be initialized first');

      const entry =
        mode === 'add'
          ? await transactionService.insertTransaction(form)
          : await transactionService.updateTransaction(form);
      if (!entry) throw new Error('Error ocurred while on inserting the transaction.');

      // Post-process
      const start = DateTime.fromJSDate(entry.date).startOf('month');
      const end = start.endOf('month');
      setDates({ from: start.toJSDate(), to: end.toJSDate() });
      toast.success(`A record has been added: [${t(entry.type)}] ${entry.title}`, {
        position: 'top-center',
      });
    } catch (err) {
      console.error(err);
    } finally {
      onClose();
    }
  }

  return (
    <Tabs defaultValue="expense" value={selectedTab} onValueChange={handleTabChange}>
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
        <ExpenseForm onSubmit={onSubmit} />
      </TabsContent>
      <TabsContent value="income">
        <IncomeForm onSubmit={onSubmit} />
      </TabsContent>
      <TabsContent value="transfer">
        <FundTransferForm onSubmit={onSubmit} />
      </TabsContent>
    </Tabs>
  );
};
