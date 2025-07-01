export interface ApiResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  statusCode: number;
  data: T;
  message: string | null;
}
