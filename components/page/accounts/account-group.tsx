import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AccountGroupSelect } from '@/db/drizzle/types';
import { ChevronsDown, ChevronsUp, ChevronsUpDown } from 'lucide-react';
import { Account } from './account';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type AccountGroupProps = {
  accountGroup: AccountGroupSelect<{
    accounts: { with: { country: true; balance: true; currency: true } };
  }>;
};

export const AccountGroup = ({ accountGroup }: AccountGroupProps) => {
  const activeAccounts = useMemo(
    () => accountGroup.accounts.filter((account) => !account.isArchive),
    [accountGroup.accounts],
  );

  const archivedAccounts = useMemo(
    () => accountGroup.accounts.filter((account) => account.isArchive),
    [accountGroup.accounts],
  );

  const hasArchive = useMemo(() => archivedAccounts.length > 0, [archivedAccounts.length]);

  const [openArchive, setOpenArchive] = useState(false);

  const handleOpenArchive = () => {
    setOpenArchive((prev) => !prev);
  };

  return (
    <Collapsible defaultOpen>
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="flex flex-col">
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-semibold">{accountGroup?.name ?? 'None'}</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle the {accountGroup?.name ?? 'None'} group</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardTitle>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={cn('flex flex-col gap-4', hasArchive ? 'pb-3' : '')}>
            {activeAccounts.map((account) => (
              <Account key={`${account.country.code}-${account.id}`} account={account} />
            ))}
          </CardContent>
          {hasArchive ? (
            <CardFooter className="flex flex-col items-start px-6 pb-4">
              {openArchive ? (
                <div className="w-full">
                  <CardTitle className="text-muted-foreground pb-3 text-lg">Archived</CardTitle>
                  {archivedAccounts.map((account) => (
                    <Account key={`${account.country.code}-${account.id}`} account={account} />
                  ))}
                </div>
              ) : null}
              <div
                role="button"
                className="flex h-full w-full cursor-pointer justify-center"
                onClick={handleOpenArchive}
              >
                {openArchive ? <ChevronsUp size={16} /> : <ChevronsDown size={16} />}
              </div>
            </CardFooter>
          ) : null}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
