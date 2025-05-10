import { useGlobalContext } from '@/app/app/global-context';
import { invisibleCharMd } from '@/components/common-functions';
import { useTransactionContext } from '@/components/page/transactions/transaction-context';
import { Separator } from '@/components/ui/separator';
import { getTransactionService } from '@/services/helper';
import { useEffect, useMemo } from 'react';

export const TransactionSummary = () => {
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
        <p className="text-primary grow text-right">
          {defaultCurrency.symbol.padEnd(currencyPadding, invisibleCharMd)}
          {income.toLocaleString()}
        </p>
      </div>
      <div className="flex flex-row gap-8">
        <p className="grow text-left">Expense</p>
        <p className="grow text-right text-red-700">-{expense.toLocaleString()}</p>
      </div>
      <Separator />
      <div className="flex flex-row gap-8">
        <p className="grow">Total</p>
        <p className="grow text-right">{total.toLocaleString()}</p>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  const { defaultCurrency } = useGlobalContext();

  return (
    <div className="flex w-full flex-col gap-2 text-lg font-normal md:w-96 md:rounded-lg md:p-4">
      <div className="flex flex-row gap-8">
        <p className="grow text-left">Income</p>
        <p className="text-primary grow text-right">{defaultCurrency.symbol}0</p>
      </div>
      <div className="flex flex-row gap-8">
        <p className="grow text-left">Expense</p>
        <p className="grow text-right text-red-700">-0</p>
      </div>
      <Separator />
      <div className="flex flex-row gap-8">
        <p className="grow">Total</p>
        <p className="grow text-right">0</p>
      </div>
    </div>
  );
};
