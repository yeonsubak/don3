import { useGlobalContext } from '@/app/app/global-context';
import type { AccountGroupType } from '@/db/drizzle/types';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AccountGroup } from './account-group';
import { CountrySection } from './country-section';

type AccountGroupTabProps = {
  tabValue: AccountGroupType;
};

export const AccountGroupTab = ({ tabValue }: AccountGroupTabProps) => {
  const { isMultiCountry } = useGlobalContext();
  const {
    data: fetchedAccountGroupsByCountry,
    isPending,
    isError,
    error,
  } = useQuery(QUERIES.accounts.accountGroupsByCountry(tabValue));

  const accountGroupsByCountry = useMemo(
    () => fetchedAccountGroupsByCountry ?? [],
    [fetchedAccountGroupsByCountry],
  );

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
    <div className={cn('flex h-full w-full flex-col xl:w-md', isMultiCountry ? '' : 'gap-4')}>
      {Object.entries(accountGroupsByCountry).map(([countryCode, accountGroup], idx) => (
        <CountrySection key={countryCode} countryCode={countryCode}>
          {accountGroup.map((accountGroup, idx) => (
            <AccountGroup key={`${countryCode}-${idx}`} accountGroup={accountGroup} />
          ))}
        </CountrySection>
      ))}
    </div>
  );
};
