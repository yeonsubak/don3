import { useGlobalContext } from '@/app/app/global-context';
import { parseMoney } from '@/components/common-functions';
import { AccountIconEmojiOnly } from '@/components/primitives/account-icon-emoji-only';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useTransactionDrawerContext } from './drawer/drawer-context';
import type { TransactionItem } from './transaction-record';

type TransactionItemMobileProps = {
  item: TransactionItem;
  readonly?: boolean;
};

export const TransactionItemMobile = ({ item, readonly }: TransactionItemMobileProps) => {
  const { id, amount, category, currencySymbol, date, icon, title, type, journalEntry } = item;
  const { currencies, accounts } = useGlobalContext();
  const [open, setOpen] = useState<boolean>(false);

  const TransactionDetail = () => {
    const {
      setOpen: setDrawerOpen,
      setSelectedTab,
      setSharedFormRef,
      setMode,
      setRecord,
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

    function handleDrawerDeleteOpen() {
      setMode('delete');
      setRecord(item);
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
          <Button
            variant="outline"
            className={readonly ? 'hidden' : ''}
            onClick={handleDrawerEditOpen}
          >
            {t(`TransactionDrawer.editBtn`)}
          </Button>
          <Button
            variant="destructive"
            className={readonly ? 'hidden' : ''}
            onClick={handleDrawerDeleteOpen}
          >
            {t(`TransactionDrawer.deleteBtn`)}
          </Button>
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
