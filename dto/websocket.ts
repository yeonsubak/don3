export type WebSocketRequestType =
  | 'insertOpLog'
  | 'insertSnapshot'
  | 'getLatestSnapshot'
  | 'getOpLogsRequest';

export type WebSocketResponseType =
  | 'error'
  | 'connectionStateUpdate'
  | 'getOpLogsResponse'
  | 'getSnapshot'
  | 'snapshotInserted'
  | 'opLogInserted';

interface WebSocketEntity<T, P = unknown> {
  requestId: string;
  userId: string;
  deviceId: string;
  type: T;
  payload: P;
}

export interface WebSocketRequest<P = unknown> extends WebSocketEntity<WebSocketRequestType, P> {
  destination?: string;
}

export interface WebSocketResponse<P = unknown> extends WebSocketEntity<WebSocketResponseType, P> {
  message?: string;
  receiveAt: string;
}

/** Internal */
type WebSocketInternalType = 'init' | 'close' | 'connectionStateUpdate';
export type WebSocketInternal<T = WebSocketInternalType, P = unknown> = WebSocketEntity<T, P>;

export type WebSocketInitRequest = WebSocketInternal<
  'init',
  {
    syncWebSocketUrl: string;
    destinationPaths: string[];
  }
>;

export type WebSocketInitResponse = WebSocketInternal<
  'init',
  {
    type: 'init';
    status: 'done';
  }
>;
