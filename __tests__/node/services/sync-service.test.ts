import type { OperationLogSelect } from '@/db/sync-db/drizzle-types';
import { getSyncRepository } from '@/repositories/repository-helpers';
import { SyncService } from '@/services/sync-service';
import { describe, test } from 'vitest';

describe('SyncService', { timeout: 1000 }, () => {
  describe('syncDataFromServer()', () => {
    test('should return human-readable string', async () => {
      // const syncRepository = await getSyncRepository();
      // const syncService = new SyncService(syncRepository);
      // const opLog: OperationLogSelect = {
      //   id: 'bd137b70-bacf-4580-b3b6-2dbea674ae7c',
      //   version: '1.0.0',
      //   schemaVersion: '0.1.4',
      //   deviceId: 'e9adf1c3-1863-4537-b4e3-27abe97651e4',
      //   sequence: 18n,
      //   method: 'TransactionRepository.insertJournalEntry',
      //   methodHash: '70ca34ce1fdb52b1',
      //   opData: {
      //     id: '1312ec6c-379d-4add-913e-ed0d05981b50',
      //     date: '2025-06-24T13:24:00.651Z',
      //     type: 'expense',
      //     title: '집세',
      //     amount: 580000,
      //     createAt: '2025-06-24T13:24:40.652Z',
      //     updateAt: null,
      //     currencyId: '0449fd3c-e5bb-4124-8784-169ddbfc072b',
      //     description: '',
      //   },
      //   createAt: new Date('2025-06-24T13:24:41.050Z'),
      //   updateAt: null,
      // };
      // await syncService.syncDataFromServer(opLog);
    });
  });
});
