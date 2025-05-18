import { useGlobalContext } from '@/app/app/global-context';
import type { AccountGroupType } from '@/db/drizzle/types';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { Plus } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AccountGroup } from './account-group';
import { useAccountDrawerContext } from './add-drawer/drawer-context';
import { CountrySection } from './country-section';

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
  } = useQuery(QUERIES.accounts.accountGroupsByCountry(tabValue));

  const accountGroupsByCountry = useMemo(
    () => fetchedAccountGroupsByCountry ?? [],
    [fetchedAccountGroupsByCountry],
  );

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  // When accounts are empty
  if (Object.keys(accountGroupsByCountry).length === 0) {
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
  }

  return (
    <div className={cn('flex h-full w-full flex-col', isMultiCountry ? '' : 'gap-4')}>
      {Object.entries(accountGroupsByCountry).map(([countryCode, accountGroup]) => (
        <CountrySection key={countryCode} countryCode={countryCode}>
          {accountGroup.map((accountGroup, idx) => (
            <AccountGroup key={`${countryCode}-${idx}`} accountGroup={accountGroup} />
          ))}
        </CountrySection>
      ))}
    </div>
  );
};
