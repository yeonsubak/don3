'use client';

import { useIsInit } from '@/components/hooks/use-is-init';
import { useLocalStorage } from '@/components/hooks/use-local-storage';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { SyncWorker } from '@/lib/sync-worker';
import { RxStompState } from '@stomp/rx-stomp';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useGlobalContext } from './global-context';

type SyncContextProps = {
  wsRef: RefObject<SyncWorker | null>;
  status: RxStompState;
};

const SyncContext = createContext<SyncContextProps | null>(null);

export const SyncContextProvider = ({ children }: { children: ReactNode }) => {
  const { queryClient } = useGlobalContext();
  const { isInit } = useIsInit();
  const [isSyncEnable] = useLocalStorage<boolean>(LOCAL_STORAGE_KEYS.SYNC.SYNC_ENABLED, false);

  const wsRef = useRef<SyncWorker | null>(null);
  const [syncStatus, setSyncStatus] = useState<RxStompState>(RxStompState.CLOSED);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initSync() {
      if (!isInit || !isSyncEnable || wsRef.current) {
        return;
      }

      const worker = await SyncWorker.getInstance();
      worker.injectQueryClientToSyncService(queryClient);
      wsRef.current = worker;

      setSyncStatus(worker.connectionState);

      unsubscribe = worker.onConnectionStateChange((newState) => {
        setSyncStatus(newState);
      });
    }

    initSync();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInit, isSyncEnable, queryClient]);

  useEffect(() => {
    switch (syncStatus) {
      case RxStompState.OPEN: {
        wsRef.current?.onReady();
        wsRef.current?.startIntervalSync();
        break;
      }
      case RxStompState.CONNECTING:
        break;
      default: {
        wsRef.current?.stopPeriodicSync();
      }
    }
  }, [syncStatus]);

  return (
    <SyncContext.Provider
      value={{
        wsRef,
        status: syncStatus,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncDrawerContextProvider');
  }
  return context;
};
