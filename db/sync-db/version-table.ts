import type { LocalVersion } from '@/db';
import type { VersionTable } from '../db-helper';

export const SYNC_SCHEMA_VERSION: VersionTable = {
  '0.0.1': {
    version: '0.0.1',
    fileName: 'ver-0.0.1.sql',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-06-23 11:58:44.820000+00'),
    updateAt: new Date('2025-07-06 12:56:34.975000+00'),
  },
} as const;

export const LATEST_CLEAN_VERSION: LocalVersion = SYNC_SCHEMA_VERSION['0.0.1'];
