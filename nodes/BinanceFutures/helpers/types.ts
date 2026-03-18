import { INodeProperties } from 'n8n-workflow';

export const BASE_URLS = {
  production: {
    fapi: 'https://fapi.binance.com',
    sapi: 'https://api.binance.com',
    wss: 'wss://fstream.binance.com',
  },
  testnet: {
    fapi: 'https://testnet.binancefuture.com',
    sapi: 'https://testnet.binancefuture.com',
    wss: 'wss://stream.binancefuture.com',
  },
} as const;

export type Environment = 'production' | 'testnet';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type BaseUrlType = 'fapi' | 'sapi';

export interface BinanceCredentials {
  apiKey: string;
  apiSecret: string;
  environment: Environment;
}

export interface BinanceRequestOptions {
  method: HttpMethod;
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  signed?: boolean;
  baseUrlType?: BaseUrlType;
}

export const INTERVALS: INodeProperties['options'] = [
  { name: '1m', value: '1m' },
  { name: '3m', value: '3m' },
  { name: '5m', value: '5m' },
  { name: '15m', value: '15m' },
  { name: '30m', value: '30m' },
  { name: '1h', value: '1h' },
  { name: '2h', value: '2h' },
  { name: '4h', value: '4h' },
  { name: '6h', value: '6h' },
  { name: '8h', value: '8h' },
  { name: '12h', value: '12h' },
  { name: '1d', value: '1d' },
  { name: '3d', value: '3d' },
  { name: '1w', value: '1w' },
  { name: '1M', value: '1M' },
];
