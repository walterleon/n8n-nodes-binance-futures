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

export interface SymbolPrecision {
  tickSize: string;
  stepSize: string;
  pricePrecision: number;
  quantityPrecision: number;
}

function countDecimals(stepStr: string): number {
  // e.g. "0.0001" → 4, "1" → 0, "0.10" → 1
  const trimmed = stepStr.replace(/0+$/, '');
  const dot = trimmed.indexOf('.');
  if (dot === -1) return 0;
  return trimmed.length - dot - 1;
}

export function roundToStep(value: number, stepSize: string): string {
  const decimals = countDecimals(stepSize);
  const step = parseFloat(stepSize);
  const rounded = Math.floor(value / step) * step;
  return rounded.toFixed(decimals);
}

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

const precisionCache = new Map<string, SymbolPrecision>();

export async function getSymbolPrecision(
  this: ContextFunctions,
  symbol: string,
): Promise<SymbolPrecision> {
  if (precisionCache.has(symbol)) {
    return precisionCache.get(symbol)!;
  }

  const info = await binanceRequest.call(this, {
    method: 'GET',
    path: '/fapi/v1/exchangeInfo',
    signed: false,
    params: {},
  });

  for (const s of info.symbols || []) {
    let tickSize = '0.00000100';
    let stepSize = '1';
    for (const f of s.filters || []) {
      if (f.filterType === 'PRICE_FILTER') tickSize = f.tickSize;
      if (f.filterType === 'LOT_SIZE') stepSize = f.stepSize;
    }
    precisionCache.set(s.symbol, {
      tickSize,
      stepSize,
      pricePrecision: s.pricePrecision || 6,
      quantityPrecision: s.quantityPrecision || 3,
    });
  }

  if (precisionCache.has(symbol)) {
    return precisionCache.get(symbol)!;
  }

  return { tickSize: '0.00000100', stepSize: '0.001', pricePrecision: 6, quantityPrecision: 3 };
}
