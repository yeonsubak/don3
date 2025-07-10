'use client';

import {
  useSettingsDrawerContext,
  type SettingsDrawerMode,
} from '@/app/app/settings/settings-drawer-context';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { DefaultCountryCurrencyCard } from './components/default-country-currency-card';
import { SettingsDrawer } from './components/drawer';
import { InformationCard } from './components/information-card';
import { SyncBackupCard } from './components/sync-backup-card';

export default function SettingsPage() {
  const { setIsProcessing, onClose, setMode, setOpen } = useSettingsDrawerContext();
  const params = useSearchParams();

  useEffect(() => {
    const drawerMode = params.get('drawerMode') as SettingsDrawerMode | null;
    const isDrawerOpen = params.get('isOpen') === 'true';

    if (drawerMode) {
      setMode(drawerMode);
    }

    if (isDrawerOpen) {
      setOpen(true);
    }
  }, [params, setMode, setOpen]);

  return (
    <>
      <div className="flex w-full flex-col gap-4 xl:max-w-lg">
        <DefaultCountryCurrencyCard />
        <SyncBackupCard />
        <InformationCard />
      </div>
      <SettingsDrawer />
    </>
  );
}
