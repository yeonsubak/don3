import { parseMoney } from '@/components/common-functions';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { AccountIconEmojiOnly } from '@/components/primitives/account-icon-emoji-only';
import type { AccountSelect, JournalEntrySelect, JournalEntryType } from '@/db/drizzle/types';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { getTransactionService } from '@/services/service-helpers';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTransactionContext } from '../transaction-context';
import { TransactionItemMobile } from './transaction-item-mobile';

export type TransactionItem = {
  id: string;
  date: Date;
  title: string;
  currencySymbol: string;
  amount: string;
  type: JournalEntryType;
  category: string;
  icon: string;
  journalEntry: JournalEntrySelect<{ currency: true; transactions: true; fxRate: true }>;
};

export const mapToTransactionItems = (
  entries: JournalEntrySelect<{ currency: true; transactions: true; fxRate: true }>[],
): TransactionItem[] => {
  return entries.map((entry) => {
    const { id, amount, title, currency, type, transactions, date } = entry;
    type Tx = (typeof transactions)[number] & { account: AccountSelect };
    const tx = transactions as Tx[];
    const creditTx = tx.find((e) => e.type === 'credit') as Tx;

    return {
      id,
      date,
      title: title ?? '',
      currencySymbol: currency.symbol,
      amount: parseMoney(amount, currency, true)?.formatted,
      type,
      category: creditTx?.account.name ?? '',
      icon: creditTx?.account.icon ?? '',
      journalEntry: entry,
    };
  });
};

export const TransactionRecord = () => {
  const {
    transactionRecordState: [transactionRecord, setTransactionRecord],
    calendarDateState: [dates, setDates],
  } = useTransactionContext();

  const isMobile = useIsMobile();

  const { from, to } = dates!;
  const {
    data: entries,
    isPending,
    isError,
    error,
  } = useQuery(
    QUERIES.transaction.journalEntries(['income', 'expense', 'transfer'], { from, to }, true),
  );

  useEffect(() => {
    async function fetchRecords() {
      const transactionService = await getTransactionService();
      const entries = await transactionService.getJournalEntries(
        ['income', 'expense', 'transfer'],
        dates!,
        true,
      );
      const records: TransactionItem[] = mapToTransactionItems(entries);
      records.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTransactionRecord(records);
    }

    fetchRecords();
  }, [dates, setTransactionRecord]);

  useEffect(() => {
    if (!entries) return;

    const records: TransactionItem[] = mapToTransactionItems(entries);
    records.sort((a, b) => b.date.getTime() - a.date.getTime());
    setTransactionRecord(records);
  }, [entries, setTransactionRecord]);

  if (isPending) return <></>;

  if (isError) return <p>Error: ${error.message}</p>;

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {transactionRecord.map((record) => (
          <TransactionItemMobile key={record.id} item={record} />
        ))}
      </div>
    );
  }

  return (
    <div className='"rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70'>
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
            <th className="w-32 px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Date
            </th>
            <th className="w-52 px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Category
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Transaction
            </th>
            <th className="w-52 px-4 py-3 text-center text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {transactionRecord.map((record) => (
            <TransactionDesktop key={record.id} {...record} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TransactionDesktop = ({
  id,
  amount,
  category,
  currencySymbol,
  date,
  icon,
  title,
  type,
}: TransactionItem) => {
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
    <tr
      key={id}
      className="text-center transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">{date.toLocaleDateString()}</div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">{category}</div>
      </td>
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
            <AccountIconEmojiOnly iconValue={icon} />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div
          className={cn(
            'text-right text-sm font-medium',
            type === 'income'
              ? 'text-emerald-600 dark:text-emerald-400'
              : type === 'expense'
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400',
          )}
        >
          <span className="mr-1">{type === 'income' ? '+' : type === 'expense' ? '-' : ''}</span>
          <span className="mr-1">{currencySymbol}</span>
          <span>{amount}</span>
        </div>
      </td>
    </tr>
  );
};
