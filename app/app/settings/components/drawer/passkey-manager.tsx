'use client';

import { Button } from '@/components/ui/button';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { getSyncService } from '@/services/service-helpers';

async function createPasskey() {
  const syncService = await getSyncService();
  return await syncService.registerPasskey();
}

async function activateSync() {
  const syncService = await getSyncService();
  const key = await syncService.getValidEncryptionKey();
  localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SYNC_ENABLED, 'true');
}

export const PasskeyActivateButton = ({
  hasPasskey,
  isPendingPasskey,
}: {
  hasPasskey: boolean;
  isPendingPasskey: boolean;
}) => {
  if (isPendingPasskey) {
    return (
      <Button type="button" disabled>
        Checking Passkey...
      </Button>
    );
  }

  if (hasPasskey) {
    return (
      <Button type="button" onClick={activateSync}>
        Activate Sync
      </Button>
    );
  }

  return (
    <Button type="button" onClick={createPasskey}>
      Create Passkey
    </Button>
  );
};
