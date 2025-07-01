export interface Response<T> {
  status: 'SUCCESS' | 'ERROR';
  statusCode: number;
  data: T;
  message: string | null;
}

export type GetSnapshotResponse = Response<{
  userId: string;
  deviceId: string;
  schemaVersion: string;
  dump: string;
  meta: string;
  iv: string;
  createAt: Date;
  updateAt: Date;
}>;
