export type RequestInfo = {
  requestId: string;
  userId: string;
  deviceId: string;
};

export type MessageType = 'command' | 'event' | 'query' | 'document' | 'error' | 'internal';

export type Message<T> = {
  destination: string;
  type: MessageType;
  requestInfo?: RequestInfo;
  body: T;
  sentAt: string;
};
