'use client';

import { AccountGroupTab } from '@/app/app/accounts/components/account-group-tab';
import { AccountDrawer } from '@/app/app/accounts/components/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { accountGroupTypeEnum } from '@/db/drizzle/schema';
import type { AccountGroupType } from '@/db/drizzle/types';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { useAccountDrawerContext } from '../account-drawer-context';

export const AccountsOverview: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className }) => {
  const accountGroupTypes = accountGroupTypeEnum.enumValues;
  const { setSelectedTab } = useAccountDrawerContext();
  const t = useTranslations('AccountGroupType');

  const handleTabChange = (value: string) => {
    setSelectedTab(value as AccountGroupType);
  };

  return (
    <>
      <div className={cn('flex flex-row gap-4', className)}>
        <Tabs defaultValue="asset" className="w-full xl:max-w-lg" onValueChange={handleTabChange}>
          <TabsList className="w-full">
            {accountGroupTypes
              .filter((type) => type !== 'uncategorized')
              .map((value) => (
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

        {/* <div className="hidden flex-row gap-4 xl:flex">
          <div>Display records here</div>
        </div> */}
      </div>
      <AccountDrawer />
    </>
  );
};
