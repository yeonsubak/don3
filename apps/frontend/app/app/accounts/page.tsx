'use client';

import { AccountGroup } from '@/components/page/accounts/account-group';
import { AddAccountDrawer } from '@/components/page/accounts/add-drawer';
import { CountryLabel } from '@/components/page/accounts/country-label';
import { accounts } from '@/db/drizzle/schema';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { type GroupAccountsByCountry } from '@/services/accounts-service';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useGlobalContext } from '../global-context';
import { Separator } from '@/components/ui/separator';

export type AccountList = (typeof accounts.$inferSelect)[];

export default function ManageAccounts() {
  const { isMultiCountry } = useGlobalContext();
  const [accountGroupsByCountry, setAccountGroupsByCountry] = useState<GroupAccountsByCountry>({});

  const {
    data: accounts,
    isPending,
    isError,
    error,
  } = useQuery(QUERIES.accounts.accountGroupsByCountry('asset'));

  useEffect(() => {
    if (!accounts) return;

    setAccountGroupsByCountry(accounts);
  }, [accounts]);

  if (isPending) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  // When accounts are empty
  if (Object.keys(accountGroupsByCountry).length === 0) {
    return <div className=""></div>;
  }

  return (
    <>
      <div className="flex flex-row gap-4">
        <div className={cn('flex h-full w-full flex-col xl:w-md', isMultiCountry ? '' : 'gap-4')}>
          {Object.entries(accountGroupsByCountry).map(([countryCode, accountGroup], idx) => {
            if (isMultiCountry) {
              return (
                <CountryLabel key={countryCode} idx={idx} countryCode={countryCode}>
                  {accountGroup.map((accountGroup, idx) => (
                    <AccountGroup key={`${countryCode}-${idx}`} accountGroup={accountGroup} />
                  ))}
                </CountryLabel>
              );
            }

            return (
              <div key={countryCode}>
                {accountGroup.map((accountGroup, idx) => (
                  <AccountGroup key={`${countryCode}-${idx}`} accountGroup={accountGroup} />
                ))}
              </div>
            );
          })}
        </div>
        <div className="hidden flex-row gap-4 xl:flex">
          <Separator orientation="vertical" className="" />
          <div>Display records here</div>
        </div>
      </div>
      <AddAccountDrawer />
    </>
  );
}
