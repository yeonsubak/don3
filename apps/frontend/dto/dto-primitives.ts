export interface Response<T = unknown> {
  status: 'SUCCESS' | 'ERROR';
  statusCode: number;
  data: T;
  message: string | null;
  sentAt: string;
}
