import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { getSyncService } from '@/services/service-helpers';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { CompletionStep } from '../../getting-started/steps/completion-step';

export const StepSync = () => {
  const [status, setStatus] = useState<'inProcess' | 'done'>('inProcess');
  const router = useRouter();

  const effectFn = useCallback(() => {
    async function runSync() {
      if (!!localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION)) {
        setStatus('done');
        return;
      }

      const syncService = await getSyncService();
      const { status, message } = await syncService.syncFromScratch(false);

      if (status === 'success') {
        console.log(message);
        router.refresh();
        setStatus('done');
      } else {
        console.warn(message);
        localStorage.setItem(LOCAL_STORAGE_KEYS.SYNC.SYNC_ENABLED, 'true');

        const params = new URLSearchParams();
        params.set('syncSignIn', 'false');
        router.push(`?${params.toString()}`);
      }
    }

    runSync();
  }, [router]);

  return <CompletionStep status={status} syncFn={effectFn} syncFnDeps={[router]} />;
};
