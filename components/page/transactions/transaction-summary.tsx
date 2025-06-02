import { useGlobalContext } from '@/app/app/global-context';
import { invisibleCharMd } from '@/components/common-functions';
import { useTransactionContext } from '@/components/page/transactions/transaction-context';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getTransactionService } from '@/services/helper';
import { useEffect, useMemo, type ReactNode } from 'react';

export const TransactionSummary = ({ children }: { children?: ReactNode }) => {
  const { defaultCurrency } = useGlobalContext();
  const {
    calendarDateState: [dates],
  } = useTransactionContext();

  const { from, to } = dates!;

  const {
    incomeSummaryState: [income, setIncome],
    expenseSummaryState: [expense, setExpense],
  } = useTransactionContext();

  useEffect(() => {
    async function fetchSummary() {
      const transactionService = await getTransactionService();
      const { income, expense } = await transactionService.getSummary(from!, to!, defaultCurrency);
      setIncome(income);
      setExpense(expense);
    }

    fetchSummary();
  }, [from, to, defaultCurrency, setIncome, setExpense]);

  const total = useMemo(() => income - expense, [income, expense]);
  const currencyPadding = useMemo(() => {
    const incomeLen = income.toLocaleString().length;
    const expenseLen = expense.toLocaleString().length;

    if (incomeLen >= expenseLen) {
      return 0;
    }

    const max = Math.max(incomeLen, expenseLen);
    const min = Math.min(incomeLen, expenseLen);
    return max - min - 1;
  }, [income, expense]);

  return (
    <div className="flex w-full flex-col gap-2 text-lg font-normal md:w-96 md:rounded-lg md:p-4">
      <div className="flex flex-row gap-8">
        <p className="grow text-left">Income</p>
        <p className="grow text-right text-emerald-600 dark:text-emerald-400">
          {defaultCurrency.symbol.padEnd(currencyPadding, invisibleCharMd)}{' '}
          {income.toLocaleString()}
        </p>
      </div>
      <div className="flex flex-row gap-8">
        <p className="grow text-left">Expense</p>
        <p className="grow text-right text-red-600 dark:text-red-400">
          -{expense.toLocaleString()}
        </p>
      </div>
      <Separator />
      <div className="mb-2 flex flex-row gap-8">
        <p className="grow">Total</p>
        <p
          className={cn(
            'grow text-right',
            total >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400',
          )}
        >
          {total.toLocaleString()}
        </p>
      </div>
      {children}
    </div>
  );
};
