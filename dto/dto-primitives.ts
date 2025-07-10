export interface RestResponse<T = Payload> {
  status: 'SUCCESS' | 'ERROR';
  statusCode: number;
  data: T;
  message: string | null;
  sentAt: string;
}

export const keyofResponse: (keyof RestResponse)[] = [
  'data',
  'message',
  'sentAt',
  'status',
  'statusCode',
];

export interface Payload {
  localId: string;
}
