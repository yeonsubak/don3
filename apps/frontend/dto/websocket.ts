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
  type: T;
  payload: P;
}

export interface WebSocketRequest<P = unknown> extends WebSocketEntity<WebSocketRequestType, P> {
  requestId: string;
  destination?: string;
}

export interface WebSocketResponse<P = unknown> extends WebSocketEntity<WebSocketResponseType, P> {
  requestId: string;
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

export type WebSocketClose = WebSocketInternal<'close'>;

export type WebSocketConnectionState = WebSocketInternal<'close'>;

/* Request handling */

export type PromiseHandler<R = unknown> = {
  resolve: (value: R | PromiseLike<R>) => void;
  reject: (err: Error) => void;
};

export type PendingRequest = {
  type: WebSocketRequestType;
  handler: PromiseHandler;
  posthook?: (res: WebSocketResponse) => Promise<void>;
};

type RequestId = string;
export type PendingRequests = Map<RequestId, PendingRequest>;
