import { keyofResponse, type Payload, type RestResponse } from './dto-primitives';

export interface SnapshotResponse extends Payload {
  schemaVersion: string;
  iv: string;
  meta: string;
  dump: string;
  createAt: string;
  updateAt: string;
}

export interface InsertSnapshotRequest extends Payload {
  schemaVersion: string;
  dump: string;
  meta: string;
  iv: string;
}

export interface InsertOpLogRequest extends Payload {
  version: string;
  schemaVersion: string;
  sequence: number;
  iv: string;
  data: string;
  queryKeys: string[];
}

export interface OpLogResponse extends Payload {
  id: string;
  userId: string;
  deviceId: string;
  version: string;
  schemaVersion: string;
  sequence: number;
  iv: string;
  data: string;
  queryKeys: string[];
}

export type OpLogRestResponse = RestResponse<OpLogResponse[]>;

export function isRestResponse(obj: object) {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    keyofResponse.every((key) => Object.keys(obj).includes(key))
  );
}
