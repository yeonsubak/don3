export type EventType = 'snapshotCreated' | 'opLogCreated';

export type Event<T> = {
  type: EventType;
  timestamp: string;
  correlationId?: string;
  data: T;
};
