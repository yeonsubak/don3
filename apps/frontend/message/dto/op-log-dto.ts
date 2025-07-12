export type OpLogDTO = {
  deviceId: string;
  localId: string;
  version: string;
  schemaVersion: string;
  sequence: number;
  iv: string;
  data: string;
  queryKeys: string[];
};
