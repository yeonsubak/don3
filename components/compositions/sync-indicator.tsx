import { SyncWorker } from '@/lib/sync-worker';
import { cn } from '@/lib/utils';
import { RxStompState } from '@stomp/rx-stomp';
import { CircleSmall, CloudOff, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useIsInit } from '../hooks/use-is-init';

export const SyncIndicator = () => {
  const { isInit } = useIsInit();

  const syncWorkerRef = useRef<SyncWorker | null>(null);
  const [status, setStatus] = useState<RxStompState>(RxStompState.CONNECTING);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initialize() {
      if (!isInit) return;

      const workerInstance = await SyncWorker.getInstance();
      syncWorkerRef.current = workerInstance;

      setStatus(workerInstance.connectionState);

      unsubscribe = workerInstance.onConnectionStateChange((newState) => {
        setStatus(newState);
      });
    }

    initialize();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInit]);

  const badgeWidth = 'w-[100px]';

  if (status === RxStompState.OPEN) {
    return (
      <Badge variant="secondary" className={cn(badgeWidth, 'bg-green-600 text-white')}>
        <CircleSmall size={10} fill="#ffffff" className="animate-pulse" />
        Sync Online
      </Badge>
    );
  }

  if (status === RxStompState.CONNECTING) {
    return (
      <Badge variant="secondary" className={cn(badgeWidth, 'bg-blue-300')}>
        <LoaderCircle size={10} className="animate-spin" />
        Connecting
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className={cn(badgeWidth)}>
      <CloudOff size={11} />
      Sync Offline
    </Badge>
  );
};
