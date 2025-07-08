import { RxStomp, RxStompState } from '@stomp/rx-stomp';

/**
 * @typedef {import('@stomp/rx-stomp').RxStompConfig} RxStompConfig
 * @typedef {import('@stomp/rx-stomp').RxStomp} RxStomp
 * @typedef {import('../dto/websocket').WebSocketRequest} WebSocketRequest
 * @typedef {import('../dto/websocket').WebSocketResponse} WebSocketResponse
 * @typedef {import('../dto/websocket').WebSocketInternal} WebSocketInternal
 * @typedef {import('../dto/websocket').WebSocketInit} WebSocketInit
 */

const MAX_RECONNECT_ATTEMPTS = 5;
let currentReconnectAttempts = 0;

/** @type {RxStompState} */
let connectionState = RxStompState.CLOSED;

/** @type {RxStomp | null} */
let stomp = null;

let subscriptions = [];

async function cleanup() {
  subscriptions.forEach((sub) => sub.unsubscribe());
  subscriptions = [];
  if (stomp && connectionState !== RxStompState.CLOSED) {
    await stomp.deactivate();
  }
  stomp = null;
  connectionState = RxStompState.CLOSED;
  currentReconnectAttempts = 0;
}

/**
 * @param {MessageEvent<WebSocketRequest | WebSocketInternal>} event
 */
self.onmessage = async function (event) {
  const { type, payload } = event.data;

  switch (type) {
    case 'init': {
      if (stomp && connectionState === RxStompState.OPEN) {
        console.warn('WebSocket already initialized and open.');
        return;
      }
      if (stomp && connectionState !== RxStompState.CLOSED) {
        console.warn('WebSocket already initializing/connecting. Ignoring init request.');
        return;
      }

      const { syncWebSocketUrl, destinationPaths } = payload;

      /** @type {RxStompConfig} */
      const config = {
        brokerURL: syncWebSocketUrl,
        splitLargeFrames: true,
        reconnectDelay: 3000,
        heartbeatIncoming: 0,
        heartbeatOutgoing: 20000,
        beforeConnect: async (client) => {
          if (currentReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            currentReconnectAttempts++;
            console.warn(`Reconnect attempt #${currentReconnectAttempts}`);
          } else {
            console.error(
              `WebSocket connection failed ${currentReconnectAttempts} times. No further attempts.`,
            );
            await cleanup();
            client.deactivate();
          }
        },
        // debug: (msg) => {
        //   console.debug('[WebSocket]', new Date().toISOString(), msg);
        // },
      };

      stomp = new RxStomp();
      stomp.configure(config);

      const stateSub = stomp.connectionState$.subscribe((state) => {
        if (currentReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          connectionState = state;
        } else {
          connectionState = RxStompState.CLOSED;
        }

        self.postMessage({ type: 'connectionStateUpdate', payload: connectionState });
      });

      const errorSub = stomp.stompErrors$.subscribe((frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body);
        self.postMessage({
          requestId: requestId,
          type: 'error',
          message: frame.headers['message'] || frame.body || 'STOMP error occurred',
          receiveAt: new Date().toISOString(),
        });
      });

      subscriptions.push(stateSub, errorSub);

      for (const path of destinationPaths) {
        const sub = stomp.watch(path).subscribe((msg) => {
          try {
            const parsedBody = JSON.parse(msg.body);
            /** @type {WebSocketResponse} */
            const response = {
              ...parsedBody,
              receiveAt: new Date().toISOString(),
            };
            self.postMessage(response);
          } catch (parseError) {
            console.error('Error parsing WebSocket message body:', parseError, msg.body);
            self.postMessage({
              type: 'error',
              requestId: requestId,
              message: `Failed to parse WebSocket response: ${parseError.message}`,
              receiveAt: new Date().toISOString(),
            });
          }
        });
        subscriptions.push(sub);
      }

      stomp.activate();
      break;
    }

    case 'close': {
      console.log('Received close message. Cleaning up WebSocket.');
      await cleanup();
      break;
    }

    default: {
      const { destination, requestId, userId, deviceId } = event.data;

      if (!stomp || connectionState !== RxStompState.OPEN) {
        console.warn('WebSocket not open. Cannot publish message.', { type, destination, payload });
        self.postMessage({
          requestId: requestId,
          type: 'error',
          message: 'WebSocket not connected. Please try again later.',
          receiveAt: new Date().toISOString(),
        });
        return;
      }

      try {
        const messageToSend = { requestId, userId, deviceId, type, payload };
        stomp.publish({
          destination,
          body: JSON.stringify(messageToSend),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (e) {
        console.error('Failed to publish message:', e);
        self.postMessage({
          requestId: requestId,
          type: 'error',
          message: `Failed to send message: ${e.message || 'Unknown error'}`,
          receiveAt: new Date().toISOString(),
        });
      }
    }
  }
};
