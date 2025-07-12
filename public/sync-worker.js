import { RxStomp, RxStompState } from '@stomp/rx-stomp';

/**
 * @typedef {import('@stomp/rx-stomp').RxStompConfig} RxStompConfig
 * @typedef {import('@stomp/rx-stomp').RxStomp} RxStomp
 * @typedef {import('../message/message').Message<unknown>} Message
 */

const MAX_RECONNECT_ATTEMPTS = 5;
let currentReconnectAttempts = 0;

/** @type {RxStompState} */
let connectionState = RxStompState.CLOSED;
let isReady = false;

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
  isReady = false;
}

/**
 * @param {MessageEvent<Message>} event
 */
self.onmessage = async function (event) {
  const { body } = event.data;

  if (body?.type === 'init') {
    if (stomp && connectionState === RxStompState.OPEN) {
      console.warn('WebSocket already initialized and open.');
      return;
    }
    if (stomp && connectionState !== RxStompState.CLOSED) {
      console.warn('WebSocket already initializing/connecting. Ignoring init request.');
      return;
    }

    isReady = false;

    const { syncWebSocketUrl, destinationPaths } = body;

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

      if (connectionState === RxStompState.OPEN && !isReady) {
        setTimeout(async () => {
          self.postMessage({
            type: 'internal',
            body: {
              type: 'init',
              state: 'ready',
            },
          });
        });
        isReady = true;
      }

      self.postMessage({
        type: 'internal',
        body: {
          type: 'connectionStateUpdate',
          state: connectionState,
        },
      });
    });

    const errorSub = stomp.stompErrors$.subscribe((frame) => {
      console.error('STOMP error:', frame.headers['message'], frame.body);
      self.postMessage({
        type: 'error',
        body: frame.headers['message'] || frame.body || 'STOMP error occurred',
        sentAt: new Date(),
      });
    });

    subscriptions.push(stateSub, errorSub);

    for (const path of destinationPaths) {
      const sub = stomp.watch(path).subscribe((msg) => {
        try {
          /** @type {Message} */
          const message = JSON.parse(msg.body);
          self.postMessage(message);
        } catch (parseError) {
          console.error('Error parsing WebSocket message body:', parseError, msg.body);
          self.postMessage({
            type: 'error',
            body: `Failed to parse WebSocket response: ${parseError.message}`,
          });
        }
      });
      subscriptions.push(sub);
    }

    stomp.activate();
    return;
  }

  if (body?.type === 'close') {
    console.log('Received close message. Cleaning up WebSocket.');
    await cleanup();
    return;
  }

  if (!stomp || connectionState !== RxStompState.OPEN) {
    console.error('WebSocket not open. Cannot publish message.', { type, destination, payload });
    return;
  }

  try {
    stomp.publish({
      destination: event.data.destination,
      body: JSON.stringify(event.data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Failed to publish message:', err);
    return;
  }
};
