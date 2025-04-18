import { useAccountsContext } from '@/app/app/accounts/accounts-context';
import { useGlobalContext } from '@/app/app/global-context';
import { parseMoney } from '@/components/common-functions';
import { AccountIcon } from '@/components/primitives/account-icon';
import type { AccountSelect } from '@/db/drizzle/types';

type AccountProps = {
  account: AccountSelect<{ balance: true; currency: true; country: true }>;
};

export const Account = ({ account }: AccountProps) => {
  const { currencies, defaultCurrency } = useGlobalContext();
  const { fxRates } = useAccountsContext();

  const currency = currencies.find((c) => c.id === account.currencyId);
  const accountBalance = parseMoney(`${account.balance ?? 0}`, account.currency, false, true);

  const fxRate =
    currency?.id !== defaultCurrency?.id
      ? fxRates.find(
          ({ baseCurrency, targetCurrency }) =>
            baseCurrency === defaultCurrency.code && targetCurrency === currency?.code,
        )
      : undefined;

  const convertedBalance = fxRate?.rate
    ? parseMoney(`${accountBalance.value * Number(fxRate.rate)}`, defaultCurrency, false, true)
    : null;

  return (
    <div className="flex flex-row items-center gap-2">
      <AccountIcon iconValue={account.icon} />
      <p className="grow text-base break-keep">{account.name}</p>
      <div className="text-right">
        <p className="font-semibold text-sky-600">
          {`${currency?.symbol ?? ''} ${accountBalance.formatted}`}
        </p>
        {convertedBalance && (
          <p className="text-xs font-semibold">
            ≈{defaultCurrency.symbol} {convertedBalance.formatted}
          </p>
        )}
      </div>
    </div>
  );
};
