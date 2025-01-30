'use client';

import { AccountsService, type GroupAccountsByCountry } from '@/app/services/accounts-service';
import { AccountGroupTopLevel } from '@/components/compositions/manage-accounts/account-group-top-level';
import type { accounts } from '@/db/drizzle/schema';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CountrySelect } from '@/db/drizzle/types';
import { ConfigService } from '@/app/services/config-service';

export type AccountList = (typeof accounts.$inferSelect)[];

export default function ManageAccounts() {
  const [isMultiCountry, setMultiCountry] = useState<boolean>(false);
  const [accountGroupsByCountry, setAccountGroupsByCountry] = useState<GroupAccountsByCountry>({});
  const [countriesInUse, setCountriesInUse] = useState<CountrySelect[]>([]);

  const tCountry = useTranslations('countryCode');

  const { isPending, isError, error } = useQuery({
    queryKey: ['initManageAccounts'],
    queryFn: async () => {
      const accountsService = await AccountsService.getInstance<AccountsService>();
      const accountGroupsByCountry = await accountsService.getAcountsByCountry('asset');
      setAccountGroupsByCountry(accountGroupsByCountry);
      setMultiCountry(Object.keys(accountGroupsByCountry).length > 0);

      const configService = await ConfigService.getInstance<ConfigService>();
      setCountriesInUse(
        await configService.getCountriesByCode(Object.keys(accountGroupsByCountry)),
      );
      return true;
    },
  });

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
                <span className="emoji mr-1">
                  {countriesInUse.find((country) => country.code === countryCode)?.emoji}
                </span>
                {tCountry(countryCode)}
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
