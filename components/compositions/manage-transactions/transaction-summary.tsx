import { invisibleCharMd } from '@/components/common-functions';
import type { DateRange } from '@/components/common-types';
import { SkeletonSimple } from '@/components/primitives/skeleton-simple';
import { QUERIES } from '@/components/tanstack-queries';
import { Separator } from '@/components/ui/separator';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

type TransactionSummaryProps = {
  dateRange: DateRange;
  setDateRange: Dispatch<SetStateAction<DateRange>>;
};

export const TransactionSummary = ({ dateRange: { from, to } }: TransactionSummaryProps) => {
  const { data: defaultCurrency } = useQuery(QUERIES.config.defaultCurrency);

  const {
    data: { incomeSummary, expenseSummary },
    isPending,
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.transaction.getIncomeSummary(from, to, defaultCurrency!),
      QUERIES.transaction.getExpenseSummary(from, to, defaultCurrency!),
    ],
    combine: (results) => ({
      data: {
        incomeSummary: results[0].data,
        expenseSummary: results[1].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  useEffect(() => {
    setIncome(incomeSummary ?? 0);
    setExpense(expenseSummary ?? 0);
  }, [expenseSummary, incomeSummary]);

  const [income, setIncome] = useState<number>(0);
  const [expense, setExpense] = useState<number>(0);
  const total = useMemo(() => income - expense, [income, expense]);
  const currencyPadding = useMemo(() => {
    const max = Math.max(income.toLocaleString().length, expense.toLocaleString().length);
    const min = Math.min(income.toLocaleString().length, expense.toLocaleString().length);
    return max - min + 1;
  }, [income, expense]);

  if (isPending) {
    return <SkeletonSimple heightInPx={97} />;
  }

  if (isError) {
    return error.map((e, i) => <p key={i}>Error: ${e?.message}</p>);
  }

  return (
    <div className="flex w-full flex-col gap-2 text-lg font-normal md:w-96 md:rounded-lg md:p-4">
      <div className="flex flex-row gap-8">
        <p className="grow text-left">Income</p>
        <p className="text-primary grow text-right">
          {defaultCurrency?.symbol.padEnd(currencyPadding, invisibleCharMd)}
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
