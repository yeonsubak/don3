import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { QUERIES } from '@/lib/tanstack-queries';
import { base64ToUint8Array, decryptWithEK } from '@/lib/utils/encryption-utils';
import { BackupService, type DumpMetaData } from '@/services/backup-service';
import { getBackupService, getSyncService } from '@/services/service-helpers';
import type { GetSnapshotResponse } from '@/services/sync-types';
import { useQueries } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompletionStep } from '../../getting-started/steps/completion-step';

async function sync(snapshot: GetSnapshotResponse, validEK: CryptoKey) {
  const { dump, meta, iv: ivBase64, schemaVersion } = snapshot.data;
  const iv = base64ToUint8Array(ivBase64);

  const decryptedDump = await decryptWithEK(dump, iv, validEK);
  const decryptedMeta: DumpMetaData = JSON.parse(await decryptWithEK(meta, iv, validEK));

  const decompressedDump = decryptedMeta.compressed
    ? BackupService.decompressGzipBase64(decryptedDump)
    : decryptedDump;

  const syncService = await getSyncService();
  const insertedSnapshot = await syncService.insertSnapshot({
    schemaVersion,
    type: 'autosave',
    meta: decryptedMeta,
    dump: decompressedDump,
  });

  const backupService = await getBackupService();
  const result = await backupService.restoreDB(
    {
      metaData: decryptedMeta,
      dump: decompressedDump,
    },
    false,
  );
}

export const StepSync = () => {
  const [status, setStatus] = useState<'idle' | 'inProcess' | 'done'>('idle');

  const { validEK, snapshot, isPending } = useQueries({
    queries: [QUERIES.sync.getValidEncryptionKey(), QUERIES.sync.getLatestSnapshotFromServer()],
    combine: (results) => ({
      validEK: results[0].data,
      snapshot: results[1].data,
      isPending: results.some((result) => result.isPending),
    }),
  });

  useEffect(() => {
    async function runSync() {
      if (isPending || !snapshot || !validEK) return;
      if (typeof localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION) !== 'undefined') {
        setStatus('done');
        return;
      }

      if (status === 'idle') {
        setStatus('inProcess');
        await sync(snapshot, validEK);
        setStatus('done');
      }
    }

    runSync();
  }, [isPending, snapshot, status, validEK]);

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
