'use client';

import { type GroupAccountsByCountry } from '@/app/services/accounts-service';
import { AccountGroupTopLevel } from '@/components/compositions/manage-accounts/account-group-top-level';
import { accounts } from '@/db/drizzle/schema';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useGlobalContext } from '../global-context';
import { useQueryContext } from '../query-context';

export type AccountList = (typeof accounts.$inferSelect)[];

export default function ManageAccounts() {
  const { isMultiCountry, countriesInUse } = useGlobalContext();
  const [accountGroupsByCountry, setAccountGroupsByCountry] = useState<GroupAccountsByCountry>({});

  const tCountry = useTranslations('countryCode');

  const { QUERIES } = useQueryContext();

  const {
    data: accounts,
    isPending,
    isError,
    error,
  } = useQuery(QUERIES.accounts.getAccountGroupsByCountry('asset'));

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

  return (
    <div className={cn('flex h-full w-full flex-col', isMultiCountry ? '' : 'gap-4')}>
      {Object.entries(accountGroupsByCountry).map(([countryCode, accountGroup], idx) => {
        if (isMultiCountry) {
          return (
            <div key={countryCode}>
              <h2 className={`p-4 text-2xl font-semibold ${idx === 0 ? 'pt-2' : ''}`}>
                {tCountry(countryCode)}
                <span className="emoji ml-2">
                  {countriesInUse.find((country) => country.code === countryCode)?.emoji}
                </span>
              </h2>
              <div className="flex flex-col gap-2">
                {accountGroup.map((e, idx) => (
                  <AccountGroupTopLevel key={`${countryCode}-${idx}`} accountGroup={e} />
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={countryCode}>
            {accountGroup.map((e, idx) => (
              <AccountGroupTopLevel key={`${countryCode}-${idx}`} accountGroup={e} />
            ))}
          </div>
        );
      })}

      {/* <WalletBackup /> */}

      {/* <ManageAccountCard accountList={accountList} setAccountList={setAccountList} />
      <div>
        {accountList.map((e) => (
          <p key={e.id}>{`id: ${e.id} | name: ${e.name} | type: ${e.type}`}</p>
        ))}
      </div> */}
      {/* <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>South Korea</CardTitle>
        </CardHeader>
        <CardContent></CardContent>
      </Card> */}
    </div>
  );
}
