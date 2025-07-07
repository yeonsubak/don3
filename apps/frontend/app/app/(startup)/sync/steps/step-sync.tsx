import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { getSyncService } from '@/services/service-helpers';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CompletionStep } from '../../getting-started/steps/completion-step';

export const StepSync = () => {
  const [status, setStatus] = useState<'idle' | 'inProcess' | 'done'>('idle');
  const router = useRouter();

  useEffect(() => {
    async function runSync() {
      if (!!localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION)) {
        setStatus('done');
        return;
      }

      if (status === 'idle') {
        setStatus('inProcess');

        const syncService = await getSyncService();
        const { status, message } = await syncService.syncFromScratch();

        if (status === 'success') {
          console.log(message);
          router.refresh();
          setStatus('done');
        } else {
          console.warn(message);
          const params = new URLSearchParams();
          params.set('syncSignIn', 'false');
          router.push(`?${params.toString()}`);
        }
      }
    }

    runSync();
  }, [router, status]);

  return (
    <div className="flex flex-col gap-4">
      {status === 'done' ? (
        <CompletionStep />
      ) : (
        <>
          <p className="text-muted-foreground">Your cloud data is now syncing to your device.</p>
          <LoaderCircle className="stroke-primary h-8 w-8 animate-spin self-center" />
        </>
      )}
    </div>
  );
};
