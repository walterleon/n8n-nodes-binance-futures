import { ITriggerFunctions } from 'n8n-core';
import { ITriggerResponse, NodeApiError } from 'n8n-workflow';
import WebSocket from 'ws';
import {
  BASE_URLS,
  BinanceCredentials,
} from '../helpers/types';

async function makeRequest(
  credentials: BinanceCredentials,
  method: string,
  path: string,
): Promise<any> {
  const baseUrl = BASE_URLS[credentials.environment].fapi;
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    method,
    headers: { 'X-MBX-APIKEY': credentials.apiKey },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Binance API error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return {};
}

export async function userDataStreamTrigger(
  this: ITriggerFunctions,
): Promise<ITriggerResponse | undefined> {
  const credentials = (await this.getCredentials(
    'binanceFuturesApi',
  )) as unknown as BinanceCredentials;

  const eventTypes = this.getNodeParameter('eventTypes') as string[];

  const wssBase = BASE_URLS[credentials.environment].wss;

  // Get listen key
  let listenKey: string;
  try {
    const response = await makeRequest(credentials, 'POST', '/fapi/v1/listenKey');
    listenKey = response.listenKey;
  } catch (error: any) {
    throw new NodeApiError(this.getNode(), {
      message: 'Failed to create listen key for User Data Stream',
      description: error.message,
    } as any);
  }

  // Renew listen key every 30 minutes
  let renewInterval: ReturnType<typeof setInterval>;
  let ws: WebSocket;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  let closed = false;

  const eventTypeMap: Record<string, string> = {
    orderUpdate: 'ORDER_TRADE_UPDATE',
    accountUpdate: 'ACCOUNT_UPDATE',
    marginCall: 'MARGIN_CALL',
    accountConfigUpdate: 'ACCOUNT_CONFIG_UPDATE',
  };

  const selectedEvents = new Set(
    eventTypes.map((t) => eventTypeMap[t]).filter(Boolean),
  );

  const connect = () => {
    ws = new WebSocket(`${wssBase}/ws/${listenKey}`);

    ws.onopen = () => {
      reconnectAttempts = 0;
    };

    ws.onmessage = (event: any) => {
      try {
        const data = JSON.parse(
          typeof event.data === 'string' ? event.data : event.data.toString(),
        );

        // Filter by selected event types
        if (selectedEvents.size > 0 && !selectedEvents.has(data.e)) {
          return;
        }

        this.emit([this.helpers.returnJsonArray([data])]);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!closed && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
        setTimeout(async () => {
          try {
            // Renew listen key before reconnecting
            await makeRequest(credentials, 'PUT', '/fapi/v1/listenKey');
          } catch {
            try {
              const response = await makeRequest(credentials, 'POST', '/fapi/v1/listenKey');
              listenKey = response.listenKey;
            } catch {
              // Will retry on next reconnect
            }
          }
          connect();
        }, delay);
      }
    };

    ws.onerror = () => {
      // onclose will handle reconnection
    };
  };

  connect();

  // Renew listen key every 30 minutes
  renewInterval = setInterval(async () => {
    try {
      await makeRequest(credentials, 'PUT', '/fapi/v1/listenKey');
    } catch {
      // If renewal fails, try to get a new listen key
      try {
        const response = await makeRequest(credentials, 'POST', '/fapi/v1/listenKey');
        listenKey = response.listenKey;
        // Reconnect with new listen key
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      } catch {
        // Will handle on next interval
      }
    }
  }, 30 * 60 * 1000);

  async function closeFunction() {
    closed = true;
    clearInterval(renewInterval);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    // Delete listen key
    try {
      await makeRequest(credentials, 'DELETE', '/fapi/v1/listenKey');
    } catch {
      // Best effort cleanup
    }
  }

  const self = this;
  async function manualTriggerFunction() {
    self.emit([
      self.helpers.returnJsonArray([
        { e: 'MANUAL_TRIGGER', message: 'Manual trigger for testing' },
      ]),
    ]);
  }

  return {
    closeFunction,
    manualTriggerFunction,
  };
}
