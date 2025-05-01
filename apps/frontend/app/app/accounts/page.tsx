'use client';

import { AccountGroupTab } from '@/components/page/accounts/account-group-tab';
import { AddAccountDrawer } from '@/components/page/accounts/add-drawer';
import { useAccountDrawerContext } from '@/components/page/accounts/add-drawer/drawer-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { accountGroupTypeEnum, accounts } from '@/db/drizzle/schema';
import type { AccountGroupType } from '@/db/drizzle/types';
import { useTranslations } from 'next-intl';

export type AccountList = (typeof accounts.$inferSelect)[];

export default function ManageAccounts() {
  const accountGroupTypes = accountGroupTypeEnum.enumValues;
  const { setGroupType } = useAccountDrawerContext();
  const t = useTranslations('AccountGroupType');

  const handleTabChange = (value: string) => {
    setGroupType(value as AccountGroupType);
  };

  return (
    <>
      <div className="flex flex-row gap-4">
        <Tabs defaultValue="asset" className="w-full xl:w-md" onValueChange={handleTabChange}>
          <TabsList className="w-full">
            {accountGroupTypes.map((value) => (
              <TabsTrigger key={value} value={value}>
                {t(value)}
              </TabsTrigger>
            ))}
          </TabsList>

          {accountGroupTypes.map((value) => (
            <TabsContent key={value} value={value}>
              <AccountGroupTab key={value} tabValue={value} />
            </TabsContent>
          ))}
        </Tabs>

        <div className="hidden flex-row gap-4 xl:flex">
          <div>Display records here</div>
        </div>
      </div>
      <AddAccountDrawer />
    </>
  );
}
