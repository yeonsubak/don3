'use client';

import { Button } from '@/components/ui/button';
import type { Session } from '@/lib/better-auth/auth-client';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { QUERIES } from '@/lib/tanstack-queries';
import { getSyncService } from '@/services/service-helpers';
import { useMutation, useQuery, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, type ComponentProps } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';

type PasskeyActivateButtonProps = ComponentProps<typeof Button> & {
  session: Session;
  queryClient: QueryClient;
  postHook?: () => Promise<void>;
};

export const PasskeyActivateButton = ({
  session,
  queryClient,
  postHook,
  ...props
}: PasskeyActivateButtonProps) => {
  const [isSyncEnabled, setIsSyncEnabled] = useLocalStorage(
    LOCAL_STORAGE_KEYS.SYNC.SYNC_ENABLED,
    false,
  );

  const { data: validEK, isPending: isValidEKPending } = useQuery(
    QUERIES.sync.getValidEncryptionKey(),
  );

  const { data: passkeys, isPending: isPassKeysPending } = useQuery({
    ...QUERIES.sync.listPasskeys(),
    enabled: !session.isPending && !!session.session,
  });

  const status = useMemo(() => {
    const hasPasskey = (passkeys?.data?.length ?? 0) > 0;

    if (isValidEKPending || isPassKeysPending) {
      return 'pending';
    }

    if (hasPasskey && !validEK) {
      return 'authRequired';
    }

    if (!isSyncEnabled && hasPasskey && validEK) {
      return 'triggerSynRequired';
    }

    if (hasPasskey && validEK) {
      return 'syncEnabled';
    }

    return 'createPasskey';
  }, [isPassKeysPending, isSyncEnabled, isValidEKPending, passkeys?.data?.length, validEK]);

  const onSuccess = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['validEncryptionKey'] });
    setIsSyncEnabled(true);
    await postHook?.();
  }, [postHook, queryClient, setIsSyncEnabled]);

  const createPasskey = useMutation({
    mutationKey: ['setValidEncryptionKey'],
    mutationFn: async () => {
      const syncService = await getSyncService();
      return await syncService.registerPasskey();
    },
    onSuccess: onSuccess,
  });

  const activateSync = useMutation({
    mutationKey: ['setValidEncryptionKey'],
    mutationFn: async () => {
      const syncService = await getSyncService();
      const key = await syncService.getValidEncryptionKey(true);
      return key;
    },
    onSuccess: onSuccess,
  });

  useEffect(() => {
    async function runOnSuccess() {
      if (status === 'syncEnabled') {
        await onSuccess();
      }
    }
    runOnSuccess();
  }, [onSuccess, status]);

  switch (status) {
    case 'pending':
      return (
        <Button type="button" disabled {...props}>
          Checking Passkey...
        </Button>
      );
    case 'authRequired':
      return (
        <Button type="button" onClick={() => activateSync.mutate()} {...props}>
          Authenticate your Passkey
        </Button>
      );
    case 'triggerSynRequired':
      return (
        <Button type="button" {...props} onClick={onSuccess}>
          Enable Sync
        </Button>
      );
    case 'syncEnabled':
      return (
        <Button type="button" disabled {...props}>
          Sync enabled
        </Button>
      );
    default:
      return (
        <Button type="button" onClick={() => createPasskey.mutate()} disabled={!session} {...props}>
          Create Passkey
        </Button>
      );
  }
};
