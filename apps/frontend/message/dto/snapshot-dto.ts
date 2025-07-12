export type SnapshotDTO = {
  localId: string;
  schemaVersion: string;
  iv: string;
  meta: string;
  dump: string;
  sequence?: number;
  createAt?: string;
};
