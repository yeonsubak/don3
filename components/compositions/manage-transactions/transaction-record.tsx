import { AccountIcon } from '@/components/primitives/account-icon';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { useTransactionContext } from './transaction-context';
import { useQuery } from '@tanstack/react-query';
import { QUERIES } from '@/components/tanstack-queries';
import { useEffect } from 'react';
import type { AccountSelect, JournalEntryType } from '@/db/drizzle/types';
import { parseMoney } from '@/components/common-functions';
import { SkeletonSimple } from '@/components/primitives/skeleton-simple';

export type TransactionItem = {
  id: number;
  title: string;
  currencySymbol: string;
  amount: string;
  type: JournalEntryType;
  category: string;
  icon: string;
  date: Date;
};

type TransactionRecordProps = {
  items: TransactionItem[];
};

export const TransactionRecord = () => {
  const {
    transactionRecordState: [transactionRecord, setTransactionRecord],
    calendarDateState: [date, _],
  } = useTransactionContext();

  const { from, to } = date!;
  const {
    data: entries,
    isPending,
    isError,
    error,
  } = useQuery(
    QUERIES.transaction.getJournalEntries(['income', 'expense', 'transfer'], { from, to }, true),
  );

  useEffect(() => {
    if (!entries) return;

    const records: TransactionItem[] = entries.map(
      ({ id, amount, title, currency, type, transactions, date }) => {
        type Tx = (typeof transactions)[number] & { account: AccountSelect };
        const tx = transactions as Tx[];
        const creditTx = tx.find((_tx) => _tx.account.type === 'credit');

        return {
          id,
          date,
          title: title ?? '',
          currencySymbol: currency.symbol,
          amount: parseMoney(amount, currency)?.formatted,
          type,
          category: creditTx?.account.name ?? '',
          icon: creditTx?.account.icon ?? '',
        };
      },
    );

    setTransactionRecord(records);
  }, [entries]);

  if (isPending) return <SkeletonSimple heightInPx={97} />;

  if (isError) return <p>Error: ${error.message}</p>;

  return (
    <>
      <TransactionMobile items={transactionRecord} />
      <TransactionDesktop items={transactionRecord} />
    </>
  );
};

const TransactionMobile = ({ items }: TransactionRecordProps) => {
  return (
    <div className="flex flex-col gap-6 md:hidden">
      {items.map(({ id, amount, category, currencySymbol, date, icon, title, type }) => (
        <div
          key={id}
          className={cn(
            'flex items-center gap-3',
            'bg-white dark:bg-zinc-900/70',
            'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
            'transition-all duration-200',
          )}
        >
          <AccountIcon iconValue={icon} />
          <div className="flex min-w-0 flex-1 items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {date.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pl-3">
              <span
                className={cn(
                  'text-sm font-medium',
                  type === 'income'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : type === 'expense'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-blue-600 dark:text-blue-400',
                )}
              >
                <span className="mr-1">
                  {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
                </span>
                <span className="mr-1">{currencySymbol}</span>
                <span>{amount}</span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const TransactionDesktop = ({ items }: TransactionRecordProps) => {
  /*  Using Data Table
  const columns: ColumnDef<TransactionItem>[] = [
    {
      accessorKey: 'title',
      header: 'Transaction',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'date',
      header: 'Date',
    },
  ];

  
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="hidden overflow-hidden md:block">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
  */

  return (
    <div className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Transaction
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map(({ id, amount, category, currencySymbol, date, icon, title, type }) => (
              <tr key={id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={cn(
                        'flex items-center gap-3',
                        'bg-white dark:bg-zinc-900/70',
                        'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                        'transition-all duration-200',
                      )}
                    >
                      <AccountIcon iconValue={icon} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {title}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : type === 'expense'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-600 dark:text-blue-400',
                    )}
                  >
                    <span className="mr-1">
                      {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
                    </span>
                    <span className="mr-1">{currencySymbol}</span>
                    <span>{amount}</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{category}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {date.toLocaleDateString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
