import { keyofResponse, type RestResponse } from './dto-primitives';
import type { WebSocketResponse } from './websocket';

export interface SnapshotResponse {
  localId: string;
  schemaVersion: string;
  iv: string;
  meta: string;
  dump: string;
  createAt: string;
  updateAt: string;
}

export interface InsertSnapshotRequest {
  localId: string;
  schemaVersion: string;
  dump: string;
  meta: string;
  iv: string;
}

export interface InsertOpLogRequest {
  localId: string;
  version: string;
  schemaVersion: string;
  sequence: number;
  iv: string;
  data: string;
  queryKeys: string[];
}

export type InsertOpLogResponse = WebSocketResponse<OpLogResponse>;

export interface OpLogResponse {
  id: string;
  localId: string;
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

type DeviceIdAndSeq = {
  deviceId: string;
  seq: number;
};

export type GetOpLogsRequest = {
  deviceIdAndSeq: DeviceIdAndSeq[];
};

export type GetOpLogsResponse = WebSocketResponse<OpLogResponse[]>;
