export type EventType = 'snapshotCreated' | 'opLogCreated';

export type Event<T> = {
  eventId: string;
  type: EventType;
  timestamp: string;
  correlationId?: string;
  data: T;
};
