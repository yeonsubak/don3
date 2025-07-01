import type { ApiResponse } from './dto-primitives';

export type GetSnapshotResponse = ApiResponse<{
  userId: string;
  deviceId: string;
  schemaVersion: string;
  dump: string;
  meta: string;
  iv: string;
  createAt: Date;
  updateAt: Date;
}>;

export type InsertSnapshotRequest = {
  userId: string;
  deviceId: string;
  schemaVersion: string;
  dump: string;
  meta: string;
  iv: string;
};
