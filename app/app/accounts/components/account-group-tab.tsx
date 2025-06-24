import { useAccountsContext } from '@/app/app/accounts/accounts-context';
import { useGlobalContext } from '@/app/app/global-context';
import { Calendar } from '@/components/compositions/calendar';
import type { AccountGroupType } from '@/db/app-db/drizzle-types';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { getAccountsService } from '@/services/service-helpers';
import { Plus } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { AccountGroup } from './account-group';
import { CountrySection } from './country-section';
import { useAccountDrawerContext } from '../account-drawer-context';

type AccountGroupTabProps = {
  tabValue: AccountGroupType;
};

export const AccountGroupTab = ({ tabValue }: AccountGroupTabProps) => {
  const { isMultiCountry } = useGlobalContext();
  const { setOpen, setFormValues } = useAccountDrawerContext();
  const {
    data: fetchedAccountGroupsByCountry,
    isError,
    error,
  } = useQuery(QUERIES.accounts.accountGroupsByCountry(tabValue, true));

  const accountGroupsByCountry = useMemo(
    () => fetchedAccountGroupsByCountry ?? [],
    [fetchedAccountGroupsByCountry],
  );

  const EmptyTab = () => {
    if (tabValue === 'uncategorized') {
      return <></>;
    }

    function handleAddButton() {
      const defaultCountryCode =
        localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY) ?? 'USA';
      setFormValues({ countryCode: defaultCountryCode });
      setOpen(true);
    }

    return (
      <div className="mt-2">
        <div
          role="button"
          className="flex h-fit w-full cursor-pointer justify-center rounded-xl border p-8 shadow-sm hover:bg-gray-100"
          onClick={handleAddButton}
        >
          <Plus size={24} />
        </div>
      </div>
    );
  };

  const ExpenseIncomeTab = () => {
    const { calendarDate, setCalendarDate } = useAccountsContext();

    const [balanceMap, setBalanceMap] = useState<Record<string, number> | undefined>(undefined);

    useEffect(() => {
      async function fetchBalanceMap() {
        if (!calendarDate?.from || !calendarDate.to) return;
        const accountsService = await getAccountsService();
        const fetchResult = await accountsService.getBalanceByType(tabValue, calendarDate);
        setBalanceMap(fetchResult);
      }

      fetchBalanceMap();
    }, [calendarDate]);

    return (
      <div className={cn('flex h-full w-full flex-col', isMultiCountry ? '' : 'gap-4')}>
        <Calendar dateState={[calendarDate, setCalendarDate]} className="my-2" />
        {Object.entries(accountGroupsByCountry).map(([countryCode, accountGroup]) => (
          <CountrySection key={countryCode} countryCode={countryCode}>
            {accountGroup.map((accountGroup, idx) => (
              <AccountGroup
                key={`${countryCode}-${idx}`}
                accountGroup={accountGroup}
                groupType={tabValue}
                balanceMap={balanceMap}
              />
            ))}
          </CountrySection>
        ))}
      </div>
    );
  };

  const AssetLiabilityTab = () => (
    <div className={cn('flex h-full w-full flex-col', isMultiCountry ? '' : 'gap-4')}>
      {Object.entries(accountGroupsByCountry).map(([countryCode, accountGroup]) => (
        <CountrySection key={countryCode} countryCode={countryCode}>
          {accountGroup.map((accountGroup, idx) => (
            <AccountGroup
              key={`${countryCode}-${idx}`}
              accountGroup={accountGroup}
              groupType={tabValue}
            />
          ))}
        </CountrySection>
      ))}
    </div>
  );

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  if (Object.keys(accountGroupsByCountry).length === 0) {
    return <EmptyTab />;
  }

  if (tabValue === 'income' || tabValue === 'expense') {
    return <ExpenseIncomeTab />;
  }

  return <AssetLiabilityTab />;
};
