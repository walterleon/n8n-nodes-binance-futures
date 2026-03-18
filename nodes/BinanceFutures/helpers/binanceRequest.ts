import { createHmac } from 'crypto';
import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  ITriggerFunctions,
} from 'n8n-core';
import { NodeApiError } from 'n8n-workflow';
import {
  BASE_URLS,
  BinanceCredentials,
  BinanceRequestOptions,
} from './types';

type ContextFunctions = IExecuteFunctions | ILoadOptionsFunctions | ITriggerFunctions;

function getBaseUrl(
  credentials: BinanceCredentials,
  baseUrlType: 'fapi' | 'sapi',
): string {
  return BASE_URLS[credentials.environment][baseUrlType];
}

function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  );
  return filtered
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

function sign(queryString: string, secret: string): string {
  return createHmac('sha256', secret).update(queryString).digest('hex');
}

export async function binanceRequest(
  this: ContextFunctions,
  options: BinanceRequestOptions,
): Promise<any> {
  const credentials = (await this.getCredentials(
    'binanceFuturesApi',
  )) as unknown as BinanceCredentials;

  const baseUrlType = options.baseUrlType || 'fapi';
  const baseUrl = getBaseUrl(credentials, baseUrlType);
  const { method, path, signed = false } = options;
  let params = { ...options.params } as Record<string, string | number | boolean | undefined>;

  // Remove undefined values
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined || params[key] === '') {
      delete params[key];
    }
  });

  if (signed) {
    params.timestamp = Date.now();
    params.recvWindow = 5000;
    const queryString = buildQueryString(params);
    params.signature = sign(queryString, credentials.apiSecret);
  }

  const queryString = buildQueryString(params);
  const url =
    method === 'GET' || method === 'DELETE'
      ? `${baseUrl}${path}${queryString ? '?' + queryString : ''}`
      : `${baseUrl}${path}`;

  const requestOptions: any = {
    method,
    url,
    headers: {
      'X-MBX-APIKEY': credentials.apiKey,
    },
    returnFullResponse: false,
  };

  if (method === 'POST' || method === 'PUT') {
    requestOptions.body = queryString;
    requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  try {
    const response = await this.helpers.httpRequest(requestOptions);
    return response;
  } catch (error: any) {
    if (error.statusCode === 429) {
      throw new NodeApiError(this.getNode(), {
        message: 'Binance rate limit exceeded. Reduce request frequency.',
        description: error.message,
      } as any);
    }
    if (error.statusCode === 418) {
      throw new NodeApiError(this.getNode(), {
        message: 'IP temporarily banned by Binance. Wait before retrying.',
        description: error.message,
      } as any);
    }

    // Parse Binance API error
    let binanceError;
    try {
      binanceError =
        typeof error.error === 'string'
          ? JSON.parse(error.error)
          : error.error;
    } catch {
      binanceError = null;
    }

    if (binanceError?.code && binanceError?.msg) {
      throw new NodeApiError(this.getNode(), {
        message: `Binance Error ${binanceError.code}: ${binanceError.msg}`,
        description: binanceError.msg,
      } as any);
    }

    throw new NodeApiError(this.getNode(), error as any);
  }
}
