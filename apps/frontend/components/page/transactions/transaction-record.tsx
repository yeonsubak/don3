import { useGlobalContext } from '@/app/app/global-context';
import { parseMoney } from '@/components/common-functions';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { AccountIconEmojiOnly } from '@/components/primitives/account-icon-emoji-only';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import type { AccountSelect, JournalEntrySelect, JournalEntryType } from '@/db/drizzle/types';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { getTransactionService } from '@/services/helper';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useTransactionDrawerContext } from './drawer/drawer-context';
import { useTransactionContext } from './transaction-context';

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
          <TransactionMobile key={record.id} {...record} />
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

const TransactionMobile = ({
  id,
  amount,
  category,
  currencySymbol,
  date,
  icon,
  title,
  type,
  journalEntry,
}: TransactionItem) => {
  const { currencies, accounts } = useGlobalContext();
  const [open, setOpen] = useState<boolean>(false);

  const TransactionDetail = () => {
    const {
      setOpen: setDrawerOpen,
      setSelectedTab,
      setSharedFormRef,
      setMode,
    } = useTransactionDrawerContext();
    const t = useTranslations('TransactionRecord');
    const tEntry = useTranslations('Entry');

    const debitAccountId = journalEntry.transactions.find((tx) => tx.type === 'debit')?.accountId;
    const creditAccountId = journalEntry.transactions.find((tx) => tx.type === 'credit')?.accountId;

    const details = {
      type: tEntry(`Type.${type}`),
      date: DateTime.fromJSDate(date).toFormat('DDD TTT'),
      debitAccount: accounts.find((account) => account.id === debitAccountId)?.name,
      creditAccount: accounts.find((account) => account.id === creditAccountId)?.name,
      description: journalEntry.description ?? '',
      baseCurrency: journalEntry.currency.name,
      targetCurrency: journalEntry.fxRate
        ? currencies.find((currency) => currency.id === journalEntry.fxRate.targetCurrencyId)?.name
        : null,
      fxRate: journalEntry.fxRate?.rate ?? null,
    };

    function handleDrawerEditOpen() {
      setSelectedTab(type);
      setMode('edit');

      const dateTimeObj = DateTime.fromJSDate(date);
      setSharedFormRef({
        id,
        date,
        time: { hour: dateTimeObj.get('hour'), minute: dateTimeObj.get('minute') },
        journalEntryType: type,
        currencyCode: journalEntry.currency.code,
        amount: parseMoney(journalEntry.amount, journalEntry.currency).formatted,
        fxRate: `${journalEntry.fxRate?.rate ?? ''}`,
        title: journalEntry.title ?? '',
        description: journalEntry.description ?? '',
        debitAccountId,
        creditAccountId,
        countryCode: accounts.find((account) => account.id === debitAccountId)?.country.code,
        isFx: !!journalEntry.fxRate,
      });
      setDrawerOpen(true);
    }

    return (
      <>
        <div className="mt-2 flex flex-col gap-2 text-zinc-600 dark:text-zinc-400">
          {Object.entries(details)
            .filter(([label, value]) => !!value)
            .map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{t(`TransactionDetails.labels.${label}`)}</span>
                <span>{value}</span>
              </div>
            ))}
          <Button variant="outline" onClick={handleDrawerEditOpen}>
            {t(`TransactionDrawer.editBtn`)}
          </Button>
          <Button variant="destructive">{t(`TransactionDrawer.deleteBtn`)}</Button>
        </div>
      </>
    );
  };

  return (
    <Collapsible key={id} className="flex flex-col" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex items-center gap-3 text-left',
          'bg-white dark:bg-zinc-900/70',
          'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
          'transition-all duration-200',
        )}
      >
        <AccountIconEmojiOnly iconValue={icon} />
        <div className="flex min-w-0 flex-1 items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {date.toLocaleDateString()}
              </p>
              <Badge variant="secondary" className="px-1.5">
                {category}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pl-3">
            <p
              className={cn(
                'text-right text-sm font-medium',
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
            </p>
            <div className="ml-1">
              {open ? (
                <ChevronDown size={16} color="#9f9fa9" />
              ) : (
                <ChevronUp size={16} color="#9f9fa9" />
              )}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="w-full px-4">
          <Separator className="mt-2 mb-1" />
          <TransactionDetail />
        </div>
      </CollapsibleContent>
    </Collapsible>
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
