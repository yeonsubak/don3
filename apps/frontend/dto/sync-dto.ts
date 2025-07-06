import type { Response } from './dto-primitives';

export type GetSnapshotResponse = Response<{
  userId: string;
  deviceId: string;
  localId: string;
  schemaVersion: string;
  dump: string;
  meta: string;
  iv: string;
  createAt: string;
  updateAt: string;
}>;

export type InsertSnapshotRequest = {
  userId: string;
  deviceId: string;
  localId: string;
  schemaVersion: string;
  dump: string;
  meta: string;
  iv: string;
};

export type InsertOpLogRequest = {
  userId: string;
  deviceId: string;
  localId: string;
  version: string;
  schemaVersion: string;
  sequence: number;
  iv: string;
  data: string;
};

export type OpLogResponse = Response<
  {
    id: string;
    userId: string;
    deviceId: string;
    localId: string;
    version: string;
    schemaVersion: string;
    sequence: number;
    iv: string;
    data: string;
  }[]
>;
