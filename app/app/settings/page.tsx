'use client';

import { DefaultCountryCurrencyCard } from './components/default-country-currency-card';
import { InformationCard } from './components/information-card';
import { SyncBackupCard } from './components/sync-backup-card';

export default function SettingsPage() {
  return (
    <div className="flex w-full flex-col gap-4 xl:max-w-lg">
      <DefaultCountryCurrencyCard />
      <SyncBackupCard />
      <InformationCard />
    </div>
  );
}
