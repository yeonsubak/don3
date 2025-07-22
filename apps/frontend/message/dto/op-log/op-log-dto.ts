export type OpLogDTO = {
  localId: string;
  deviceId: string;
  chunkId: string;
  version: string;
  schemaVersion: string;
  sequence: number;
  iv: string;
  data: string;
  queryKeys: string[];
};
