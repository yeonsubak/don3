export type SnapshotDTO = {
  schemaVersion: string;
  iv: string;
  meta: string;
  dump: string;
  checksum: string;
  createAt?: string;
};
