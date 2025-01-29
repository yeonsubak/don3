import type { DateRange } from '@/components/common-types';
import { QUERIES } from '@/components/tanstack-queries';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

type TransactionSummaryProps = {
  dateRange: DateRange;
  setDateRange: Dispatch<SetStateAction<DateRange>>;
};

export const TransactionSummary = ({ dateRange: { from, to } }: TransactionSummaryProps) => {
  const { data, isPending, isError, error } = useQueries({
    queries: [
      QUERIES.transaction.getIncomeSummary(from, to),
      QUERIES.transaction.getExpenseSummary(from, to),
      QUERIES.config.defaultCurrency,
    ],
    combine: (results) => ({
      data: {
        incomeSummary: results[0].data,
        expenseSummary: results[1].data,
        defaultCurrency: results[2].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  useEffect(() => {
    setIncome(data.incomeSummary ?? 0);
    setExpense(data.expenseSummary ?? 0);
  }, [data.expenseSummary, data.incomeSummary]);

  const [income, setIncome] = useState<number>(0);
  const [expense, setExpense] = useState<number>(0);
  const total = useMemo(() => income - expense, [income, expense]);

  if (isPending) {
    return <Skeleton className="h-full w-full" />;
  }

  if (isError) {
    return error.map((e) => <p key={e?.name}>Error: ${e?.message}</p>);
  }

  return (
    <div className="flex flex-col gap-1 font-normal">
      <div className="flex flex-row gap-8 text-xl">
        <p className="grow text-left">Income</p>
        <p className="grow text-right text-blue-800">₩ {income.toLocaleString()}</p>
      </div>
      <div className="flex flex-row gap-8 text-xl">
        <p className="grow text-left">Expense</p>
        <p className="grow text-right text-red-700">-{expense.toLocaleString()}</p>
      </div>
      <Separator />
      <div className="flex flex-row gap-8 text-xl">
        <p className="grow">Total</p>
        <p className="grow text-right">{total.toLocaleString()}</p>
      </div>
    </div>
  );
};
