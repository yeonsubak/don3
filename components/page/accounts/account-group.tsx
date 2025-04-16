import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AccountGroupSelect } from '@/db/drizzle/types';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Account } from './account';
import { useAccountDrawerContext } from './add-drawer/drawer-context';

type AccountGroupProps = {
  accountGroup: AccountGroupSelect<{
    accounts: { with: { country: true; balance: true; currency: true } };
  }>;
};

export const AccountGroup = ({ accountGroup }: AccountGroupProps) => {
  const [isAccountOpen, setAccountOpen] = useState<boolean>(true);

  return (
    <Collapsible open={isAccountOpen} onOpenChange={setAccountOpen}>
      <Card>
        <CardHeader>
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
          <CardContent className="flex flex-col gap-4">
            {accountGroup.accounts?.map((account) => (
              <Account key={`${account.country.code}-${account.id}`} account={account} />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
