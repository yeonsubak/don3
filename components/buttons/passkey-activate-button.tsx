'use client';

import { Button } from '@/components/ui/button';
import type { Session } from '@/lib/better-auth/auth-client';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { QUERIES } from '@/lib/tanstack-queries';
import { getSyncService } from '@/services/service-helpers';
import { useMutation, useQuery, type QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, type ComponentProps } from 'react';

type PasskeyActivateButtonProps = ComponentProps<typeof Button> & {
  session: Session;
  queryClient: QueryClient;
  postHook?: () => void;
};

export const PasskeyActivateButton = ({
  session,
  queryClient,
  postHook,
  ...props
}: PasskeyActivateButtonProps) => {
  const { data: validEK, isPending: isValidEKPending } = useQuery(
    QUERIES.sync.getValidEncryptionKey(),
  );
  const cryptoKey = useMemo(() => validEK, [validEK]);

  const { data: passkeys, isPending: isPassKeysPending } = useQuery({
    ...QUERIES.sync.listPasskeys(),
    enabled: !session.isPending && !!session.session,
  });
  const hasPasskey = useMemo(() => (passkeys?.data?.length ?? 0) > 0, [passkeys?.data?.length]);

  useEffect(() => {
    if (hasPasskey && cryptoKey && postHook) {
      postHook();
    }
  }, [cryptoKey, hasPasskey, postHook]);

  const createPasskey = useMutation({
    mutationKey: ['setValidEncryptionKey'],
    mutationFn: async () => {
      const syncService = await getSyncService();
      return await syncService.registerPasskey();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['validEncryptionKey'] });
      postHook?.();
    },
  });

  const activateSync = useMutation({
    mutationKey: ['setValidEncryptionKey'],
    mutationFn: async () => {
      const syncService = await getSyncService();
      const key = await syncService.getValidEncryptionKey(true);
      if (key) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.APP.SYNC_ENABLED, 'true');
      }
      return key;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['validEncryptionKey'] });
      postHook?.();
    },
  });

  if (isValidEKPending && isPassKeysPending) {
    return (
      <Button type="button" disabled {...props}>
        Checking Passkey...
      </Button>
    );
  }

  if (hasPasskey && !cryptoKey) {
    return (
      <Button type="button" onClick={() => activateSync.mutate()} {...props}>
        Authenticate your Passkey
      </Button>
    );
  }

  if (hasPasskey && cryptoKey) {
    return (
      <Button type="button" disabled {...props}>
        Sync enabled
      </Button>
    );
  }

  return (
    <Button type="button" onClick={() => createPasskey.mutate()} {...props}>
      Create Passkey
    </Button>
  );
};
