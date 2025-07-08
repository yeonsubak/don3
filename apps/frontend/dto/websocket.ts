import type { Payload } from './dto-primitives';

export type WebSocketRequestType =
  | 'insertOpLog'
  | 'insertSnapshot'
  | 'getLatestSnapshot'
  | 'sendMsgToServer';

export type WebSocketResponseType =
  | 'error'
  | 'connectionStateUpdate'
  | 'getOpLog'
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

export interface WebSocketResponse<P = Payload> extends WebSocketEntity<WebSocketResponseType, P> {
  message?: string;
  receiveAt: string;
}

/** Internal */
type WebSocketInternalType = 'init' | 'close' | 'connectionStateUpdate';
export type WebSocketInternal<T = WebSocketInternalType, P = unknown> = WebSocketEntity<T, P>;

export type WebSocketInit = WebSocketInternal<
  'init',
  {
    syncWebSocketUrl: string;
    destinationPaths: string[];
  }
>;
