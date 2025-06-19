import { compareSemanticVersions } from '@/app/api/database/common';

interface Version {
  version: string;
  nextVersion?: string | null | undefined;
  requireMigration: boolean;
  requireDumpToUpdate: boolean;
  createAt: Date;
  updateAt?: Date;
}

export interface LocalVersion extends Version {
  fileName?: string;
}

export type RemoteVersion = Version;

export const SCHEMA_VERSION_TABLE: Record<string, LocalVersion> = {
  '0.0.1': {
    version: '0.0.1',
    fileName: 'ver-0.0.1.sql',
    nextVersion: '0.0.2',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-03-08 17:19:00.347543+00'),
  },
  '0.0.2': {
    version: '0.0.2',
    fileName: 'ver-0.0.2.sql',
    nextVersion: '0.0.3',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-04-16 14:06:36.763051+00'),
    updateAt: new Date('2025-04-17 11:01:34+00'),
  },
  '0.0.3': {
    version: '0.0.3',
    fileName: 'ver-0.0.3.sql',
    nextVersion: '0.0.4',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-04-25 16:27:19.173301+00'),
  },
  '0.0.4': {
    version: '0.0.4',
    fileName: 'ver-0.0.4.sql',
    nextVersion: '0.0.5',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-04-26 12:52:26.127472+00'),
  },
  '0.0.5': {
    version: '0.0.5',
    fileName: 'ver-0.0.5.sql',
    nextVersion: '0.0.6',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-03-08 17:19:00.347543+00'),
  },
  '0.0.6': {
    version: '0.0.6',
    fileName: 'ver-0.0.6.sql',
    nextVersion: '0.1.0',
    requireMigration: true,
    requireDumpToUpdate: false,
    createAt: new Date('2025-05-14 18:00:55.265000+00'),
  },
  '0.1.0': {
    version: '0.1.0',
    fileName: 'ver-0.1.0.sql',
    nextVersion: '0.1.1',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-05-14 18:00:55.265000+00'),
  },
  '0.1.1': {
    version: '0.1.1',
    fileName: 'ver-0.1.1.sql',
    nextVersion: '0.1.2',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-05-30 09:57:55.413000+00'),
  },
  '0.1.2': {
    version: '0.1.2',
    fileName: undefined,
    nextVersion: '0.1.3',
    requireMigration: false,
    requireDumpToUpdate: true,
    createAt: new Date('2025-06-02 12:27:56.012000+00'),
  },
  '0.1.3': {
    version: '0.1.3',
    fileName: 'ver-0.1.3.sql',
    requireMigration: false,
    requireDumpToUpdate: false,
    createAt: new Date('2025-06-19 09:57:55.413000+00'),
  },
} as const;

export const LATEST_CLEAN_VERSION: LocalVersion = SCHEMA_VERSION_TABLE['0.1.0'];

export const getLatestSchemaVersion = () => {
  return Object.keys(SCHEMA_VERSION_TABLE)
    .sort((a, b) => compareSemanticVersions(a, b))
    .at(-1)!;
};
