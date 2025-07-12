export type QueryType = 'getLatestSnapshot' | 'getOpLogs';

export type Query<T> = {
  queryId: string;
  type: QueryType;
  timestamp: string;
  parameters: T;
};
