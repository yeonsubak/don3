import { useAccountsContext } from '@/app/app/accounts/accounts-context';
import { useGlobalContext } from '@/app/app/global-context';
import { parseMoney } from '@/components/common-functions';
import { AccountIconEmojiOnly } from '@/components/primitives/account-icon-emoji-only';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { AccountGroupType, AccountSelect } from '@/db/drizzle/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAccountDrawerContext } from '../account-drawer-context';

type AccountProps = {
  account: AccountSelect<{ balance: true; currency: true; country: true }>;
  groupType: AccountGroupType;
  balanceMap?: Record<string, number>;
};

export const Account = ({ account, balanceMap, groupType }: AccountProps) => {
  const { currencies, defaultCurrency } = useGlobalContext();
  const { setOpen, setMode, setFormValues, setAccount } = useAccountDrawerContext();
  const { fxRates } = useAccountsContext();

  const currency = currencies.find((c) => c.id === account.currencyId);
  const balance = balanceMap ? balanceMap[account.id] : account.balance?.balance;
  const parsedBalance = parseMoney(balance, account.currency, true, true);

  const fxRate =
    currency?.id !== defaultCurrency?.id
      ? fxRates.find(
          ({ baseCurrency, targetCurrency }) =>
            baseCurrency === currency?.code && targetCurrency === defaultCurrency.code,
        )
      : undefined;

  const convertedBalance = fxRate?.rate
    ? parseMoney(parsedBalance.value * Number(fxRate.rate), defaultCurrency, true, true)
    : null;

  function handleEdit() {
    setFormValues({
      accountId: account.id,
      accountName: account.name,
      accountGroupId: account.accountGroupId,
      accountType: account.type,
      countryCode: account.country.code,
      currencyCode: account.currency.code,
      icon: account.icon,
    });
    setMode('edit');
    setOpen(true);
  }

  function handleArchive() {
    setMode('archive');
    setAccount(account);
    setOpen(true);
  }

  function handleReactivate() {
    setMode('reactivate');
    setAccount(account);
    setOpen(true);
  }

  function handleDelete() {
    setMode('delete');
    setAccount(account);
    setOpen(true);
  }

  function handleModifyOrder() {
    toast('Modify order will be available in the future. Stay tuned!', {
      position: 'top-center',
    });
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex flex-row items-center gap-2 select-none">
          <AccountIconEmojiOnly
            iconValue={account.icon}
            className={account.isArchive ? 'text-muted-foreground grayscale' : ''}
          />
          <p
            className={cn(
              'grow text-base break-keep',
              account.isArchive ? 'text-muted-foreground' : '',
            )}
          >
            {account.name}
          </p>
          <div className="text-right">
            {(groupType === 'income' || groupType === 'expense') && !balanceMap ? (
              <Skeleton className="h-4 w-[60px]" />
            ) : (
              <p className="min-w-[30px] font-semibold text-sky-600">{`${currency?.symbol ?? ''} ${parsedBalance.formatted}`}</p>
            )}
            {convertedBalance && (
              <p className="text-xs font-semibold">
                ≈{defaultCurrency.symbol} {convertedBalance.formatted}
              </p>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuLabel>{account.name}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleEdit}>Edit</ContextMenuItem>
        <ContextMenuItem onClick={handleModifyOrder}>Modify order</ContextMenuItem>
        {account.isArchive ? (
          <ContextMenuItem onClick={handleReactivate}>Reactivate</ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={handleArchive}>Archive</ContextMenuItem>
        )}
        <ContextMenuItem onClick={handleDelete} variant="destructive">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
