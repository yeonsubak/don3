export type QueryType = 'getLatestSnapshot' | 'getOpLogs' | 'getLastSnapshotSequence';

export type Query<T> = {
  type: QueryType;
  timestamp: string;
  parameters: T;
};
