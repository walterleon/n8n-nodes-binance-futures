# Binance USDS-Margined Futures n8n Node — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete n8n community node for Binance USDS-Margined Futures trading with zero external dependencies, supporting all order types, account management, wallet transfers, market data, and real-time WebSocket triggers.

**Architecture:** Modular actions pattern (properties.ts + execute.ts per operation) with a centralized `binanceRequest` helper that handles HMAC-SHA256 signing and HTTP calls via n8n's native `this.helpers.httpRequest`. WebSocket trigger manages listen key lifecycle with automatic reconnection.

**Tech Stack:** TypeScript, n8n-workflow/n8n-core APIs, Node.js crypto (HMAC-SHA256), WebSocket (ws, bundled in n8n-core)

**Spec:** `docs/superpowers/specs/2026-03-18-binance-futures-node-design.md`

---

## Task 1: Project Cleanup & Setup

**Files:**
- Modify: `package.json`
- Delete: `nodes/Binance/` (entire directory)
- Delete: `credentials/BinanceApi.credentials.ts`
- Create: `nodes/BinanceFutures/` (empty directory structure)

- [ ] **Step 1: Remove old dependencies and update package.json**

Replace entire `package.json` with:

```json
{
  "name": "n8n-nodes-binance-futures",
  "version": "1.0.0",
  "description": "n8n node for Binance USDS-Margined Futures trading",
  "keywords": ["n8n-community-node-package"],
  "license": "MIT",
  "author": {
    "name": "Walter"
  },
  "main": "index.js",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "tsc && gulp build:icons",
    "watch": "tsc --watch",
    "format": "prettier nodes credentials --write",
    "lint": "eslint nodes credentials --ext .ts"
  },
  "files": ["dist"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": ["dist/credentials/BinanceFuturesApi.credentials.js"],
    "nodes": [
      "dist/nodes/BinanceFutures/BinanceFutures.node.js",
      "dist/nodes/BinanceFutures/BinanceFuturesTrigger.node.js"
    ]
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/parser": "^5.51.0",
    "eslint": "^8.34.0",
    "eslint-plugin-n8n-nodes-base": "^1.12.1",
    "gulp": "^4.0.2",
    "n8n-core": "^0.154.1",
    "n8n-workflow": "^0.136.1",
    "prettier": "^2.8.4",
    "typescript": "~4.9.5",
    "rimraf": "^6.0.0"
  },
  "dependencies": {}
}
```

- [ ] **Step 2: Delete old node files**

```bash
rm -rf nodes/Binance
rm -f credentials/BinanceApi.credentials.ts
```

- [ ] **Step 3: Create new directory structure**

```bash
mkdir -p nodes/BinanceFutures/helpers
mkdir -p nodes/BinanceFutures/methods
mkdir -p nodes/BinanceFutures/actions/order
mkdir -p nodes/BinanceFutures/actions/position
mkdir -p nodes/BinanceFutures/actions/account
mkdir -p nodes/BinanceFutures/actions/wallet
mkdir -p nodes/BinanceFutures/actions/marketData
mkdir -p nodes/BinanceFutures/triggers
```

- [ ] **Step 4: Copy SVG icon**

Copy `Binance.svg` from git history or create a new one at `nodes/BinanceFutures/BinanceFutures.svg`. If the old one is still accessible before deletion, copy it first:

```bash
cp nodes/Binance/Binance.svg nodes/BinanceFutures/BinanceFutures.svg
```

Note: Do the SVG copy BEFORE deleting the old directory in Step 2.

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: clean project for binance futures node refactor"
```

---

## Task 2: Credentials

**Files:**
- Create: `credentials/BinanceFuturesApi.credentials.ts`

- [ ] **Step 1: Create credentials file**

```typescript
import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class BinanceFuturesApi implements ICredentialType {
  name = 'binanceFuturesApi';
  displayName = 'Binance Futures API';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        { name: 'Production', value: 'production' },
        { name: 'Testnet', value: 'testnet' },
      ],
      default: 'production',
    },
  ];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit credentials/BinanceFuturesApi.credentials.ts
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add credentials/BinanceFuturesApi.credentials.ts
git commit -m "feat: add BinanceFuturesApi credentials with testnet support"
```

---

## Task 3: Types & Helper (binanceRequest)

**Files:**
- Create: `nodes/BinanceFutures/helpers/types.ts`
- Create: `nodes/BinanceFutures/helpers/binanceRequest.ts`

- [ ] **Step 1: Create types file**

```typescript
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
```

- [ ] **Step 2: Create binanceRequest helper**

```typescript
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

  // httpRequest returns JSON by default

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
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors (may have some if node files don't exist yet — that's OK, we check these specific files)

- [ ] **Step 4: Commit**

```bash
git add nodes/BinanceFutures/helpers/
git commit -m "feat: add binanceRequest helper with HMAC-SHA256 signing"
```

---

## Task 4: Node Shell & Routing

**Files:**
- Create: `nodes/BinanceFutures/actions/router.ts`
- Create: `nodes/BinanceFutures/actions/resources.ts`
- Create: `nodes/BinanceFutures/BinanceFutures.node.ts`
- Create: `nodes/BinanceFutures/BinanceFutures.node.json`

- [ ] **Step 1: Create resources definition (resource + operation dropdowns)**

File: `nodes/BinanceFutures/actions/resources.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const resourceProperty: INodeProperties = {
  displayName: 'Resource',
  name: 'resource',
  type: 'options',
  noDataExpression: true,
  options: [
    { name: 'Order', value: 'order' },
    { name: 'Position', value: 'position' },
    { name: 'Account', value: 'account' },
    { name: 'Wallet', value: 'wallet' },
    { name: 'Market Data', value: 'marketData' },
  ],
  default: 'order',
};

export const orderOperationProperty: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['order'] } },
  options: [
    { name: 'Place Order', value: 'placeOrder', action: 'Place an order' },
    { name: 'Place Batch Orders', value: 'placeBatchOrders', action: 'Place batch orders' },
    { name: 'Modify Order', value: 'modifyOrder', action: 'Modify an order' },
    { name: 'Cancel Order', value: 'cancelOrder', action: 'Cancel an order' },
    { name: 'Cancel All Orders', value: 'cancelAllOrders', action: 'Cancel all orders' },
    { name: 'Get Order', value: 'getOrder', action: 'Get an order' },
    { name: 'Get Open Orders', value: 'getOpenOrders', action: 'Get open orders' },
    { name: 'Get All Orders', value: 'getAllOrders', action: 'Get all orders history' },
  ],
  default: 'placeOrder',
};

export const positionOperationProperty: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['position'] } },
  options: [
    { name: 'Get Positions', value: 'getPositions', action: 'Get positions' },
    { name: 'Change Leverage', value: 'changeLeverage', action: 'Change leverage' },
    { name: 'Change Margin Type', value: 'changeMarginType', action: 'Change margin type' },
  ],
  default: 'getPositions',
};

export const accountOperationProperty: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['account'] } },
  options: [
    { name: 'Get Account Info', value: 'getAccountInfo', action: 'Get account info' },
    { name: 'Get Balance', value: 'getBalance', action: 'Get balance' },
    { name: 'Get Income History', value: 'getIncomeHistory', action: 'Get income history' },
    { name: 'Get Trade History', value: 'getTradeHistory', action: 'Get trade history' },
    { name: 'Get Leverage Brackets', value: 'getLeverageBrackets', action: 'Get leverage brackets' },
    { name: 'Get Commission Rate', value: 'getCommissionRate', action: 'Get commission rate' },
  ],
  default: 'getAccountInfo',
};

export const walletOperationProperty: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['wallet'] } },
  options: [
    { name: 'Transfer', value: 'transfer', action: 'Transfer between wallets' },
    { name: 'Withdraw', value: 'withdraw', action: 'Withdraw to external wallet' },
    { name: 'Get Transfer History', value: 'getTransferHistory', action: 'Get transfer history' },
  ],
  default: 'transfer',
};

export const marketDataOperationProperty: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['marketData'] } },
  options: [
    { name: 'Get Klines', value: 'getKlines', action: 'Get klines candlestick data' },
    { name: 'Get Mark Price', value: 'getMarkPrice', action: 'Get mark price' },
    { name: 'Get Funding Rate', value: 'getFundingRate', action: 'Get funding rate history' },
    { name: 'Get Ticker 24h', value: 'getTicker24h', action: 'Get 24h ticker' },
    { name: 'Get Order Book', value: 'getOrderBook', action: 'Get order book' },
    { name: 'Get Open Interest', value: 'getOpenInterest', action: 'Get open interest' },
  ],
  default: 'getKlines',
};
```

- [ ] **Step 2: Create router**

File: `nodes/BinanceFutures/actions/router.ts`

```typescript
import { INodeExecutionData } from 'n8n-workflow';
import { IExecuteFunctions } from 'n8n-core';

import * as order from './order';
import * as position from './position';
import * as account from './account';
import * as wallet from './wallet';
import * as marketData from './marketData';

const resourceExecutors: Record<
  string,
  Record<string, (ctx: IExecuteFunctions, index: number) => Promise<INodeExecutionData[]>>
> = {
  order,
  position,
  account,
  wallet,
  marketData,
};

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let index = 0; index < items.length; index++) {
    const resource = this.getNodeParameter('resource', index) as string;
    const operation = this.getNodeParameter('operation', index) as string;

    try {
      const executor = resourceExecutors[resource]?.[operation];
      if (!executor) {
        throw new Error(`Unknown resource/operation: ${resource}/${operation}`);
      }

      const data = await executor(this, index);
      const dataWithMeta = data.map((value) => ({
        ...value,
        pairedItem: { item: index },
      }));

      returnData.push(...dataWithMeta);
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message }, pairedItem: { item: index } });
      } else {
        if (error.context) error.context.itemIndex = index;
        throw error;
      }
    }
  }

  return [returnData];
}
```

- [ ] **Step 3: Create placeholder index files for each resource**

Create empty index files so the router imports don't fail. These will be filled in subsequent tasks.

File: `nodes/BinanceFutures/actions/order/index.ts`
```typescript
// Operations will be exported here as they are implemented
```

File: `nodes/BinanceFutures/actions/position/index.ts`
```typescript
// Operations will be exported here as they are implemented
```

File: `nodes/BinanceFutures/actions/account/index.ts`
```typescript
// Operations will be exported here as they are implemented
```

File: `nodes/BinanceFutures/actions/wallet/index.ts`
```typescript
// Operations will be exported here as they are implemented
```

File: `nodes/BinanceFutures/actions/marketData/index.ts`
```typescript
// Operations will be exported here as they are implemented
```

- [ ] **Step 4: Create the main node class**

File: `nodes/BinanceFutures/BinanceFutures.node.ts`

```typescript
import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { IExecuteFunctions } from 'n8n-core';

import { loadOptions } from './methods/loadOptions';
import { router } from './actions/router';

import {
  resourceProperty,
  orderOperationProperty,
  positionOperationProperty,
  accountOperationProperty,
  walletOperationProperty,
  marketDataOperationProperty,
} from './actions/resources';

// Import operation properties (will be added as resources are implemented)
// import { orderProperties } from './actions/order';
// etc.

export class BinanceFutures implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Binance Futures',
    name: 'binanceFutures',
    description: 'Trade on Binance USDS-Margined Futures',
    icon: 'file:BinanceFutures.svg',
    version: 1,
    inputs: ['main'],
    outputs: ['main'],
    defaults: {
      name: 'Binance Futures',
    },
    group: ['Binance'],
    credentials: [{ name: 'binanceFuturesApi', required: true }],
    properties: [
      resourceProperty,
      orderOperationProperty,
      positionOperationProperty,
      accountOperationProperty,
      walletOperationProperty,
      marketDataOperationProperty,
      // Operation-specific properties will be spread here
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return router.call(this);
  }

  methods = { loadOptions };
}
```

- [ ] **Step 5: Create node descriptor JSON**

File: `nodes/BinanceFutures/BinanceFutures.node.json`

```json
{
  "node": "n8n-nodes-binance-futures.binanceFutures",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["Finance & Payments"],
  "resources": {
    "credentialDocumentation": [],
    "primaryDocumentation": []
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add nodes/BinanceFutures/
git commit -m "feat: add node shell with resource/operation routing"
```

---

## Task 5: Load Options (getSymbols)

**Files:**
- Create: `nodes/BinanceFutures/methods/loadOptions.ts`
- Create: `nodes/BinanceFutures/methods/index.ts`

- [ ] **Step 1: Create loadOptions**

File: `nodes/BinanceFutures/methods/loadOptions.ts`

```typescript
import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { binanceRequest } from '../helpers/binanceRequest';

export async function getSymbols(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const response = await binanceRequest.call(this, {
    method: 'GET',
    path: '/fapi/v1/exchangeInfo',
  });

  return response.symbols
    .filter((s: any) => s.status === 'TRADING')
    .map((s: any) => ({
      name: s.symbol,
      value: s.symbol,
    }));
}
```

n8n expects `methods.loadOptions` to be an object with function names as keys. In `BinanceFutures.node.ts`, the `methods` property should be:
```typescript
import { getSymbols } from './methods/loadOptions';

// In the class:
methods = {
  loadOptions: {
    getSymbols,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add nodes/BinanceFutures/methods/
git commit -m "feat: add loadOptions for dynamic symbol dropdown"
```

---

## Task 6: Market Data Resource (6 operations)

**Files:**
- Create: `nodes/BinanceFutures/actions/marketData/getKlines.properties.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getKlines.execute.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getMarkPrice.properties.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getMarkPrice.execute.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getFundingRate.properties.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getFundingRate.execute.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getTicker24h.properties.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getTicker24h.execute.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getOrderBook.properties.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getOrderBook.execute.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getOpenInterest.properties.ts`
- Create: `nodes/BinanceFutures/actions/marketData/getOpenInterest.execute.ts`
- Modify: `nodes/BinanceFutures/actions/marketData/index.ts`
- Modify: `nodes/BinanceFutures/BinanceFutures.node.ts` (add properties)

- [ ] **Step 1: Create getKlines**

File: `nodes/BinanceFutures/actions/marketData/getKlines.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';
import { INTERVALS } from '../../helpers/types';

export const getKlinesProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Interval',
    name: 'interval',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    options: INTERVALS as any,
    default: '1h',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    typeOptions: { minValue: 1, maxValue: 1500 },
    default: 50,
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    default: '',
    description: 'Optional start time for the data range',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    default: '',
    description: 'Optional end time for the data range',
  },
];
```

File: `nodes/BinanceFutures/actions/marketData/getKlines.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getKlines(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const interval = ctx.getNodeParameter('interval', index) as string;
  const limit = ctx.getNodeParameter('limit', index) as number;
  const startTime = ctx.getNodeParameter('startTime', index) as string;
  const endTime = ctx.getNodeParameter('endTime', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/klines',
    params: {
      symbol,
      interval,
      limit,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
    },
  });

  // Transform kline arrays into objects
  const klines = response.map((k: any[]) => ({
    openTime: k[0],
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
    closeTime: k[6],
    quoteVolume: Number(k[7]),
    trades: k[8],
    takerBuyBaseVolume: Number(k[9]),
    takerBuyQuoteVolume: Number(k[10]),
  }));

  return ctx.helpers.returnJsonArray(klines);
}
```

- [ ] **Step 2: Create getMarkPrice**

File: `nodes/BinanceFutures/actions/marketData/getMarkPrice.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getMarkPriceProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty for all symbols.',
    displayOptions: { show: { resource: ['marketData'], operation: ['getMarkPrice'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/marketData/getMarkPrice.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getMarkPrice(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/premiumIndex',
    params: { symbol: symbol || undefined },
  });

  return ctx.helpers.returnJsonArray(
    Array.isArray(response) ? response : [response],
  );
}
```

- [ ] **Step 3: Create getFundingRate**

File: `nodes/BinanceFutures/actions/marketData/getFundingRate.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getFundingRateProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['marketData'], operation: ['getFundingRate'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['marketData'], operation: ['getFundingRate'] } },
    typeOptions: { minValue: 1, maxValue: 1000 },
    default: 100,
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['marketData'], operation: ['getFundingRate'] } },
    default: '',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['marketData'], operation: ['getFundingRate'] } },
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/marketData/getFundingRate.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getFundingRate(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const limit = ctx.getNodeParameter('limit', index) as number;
  const startTime = ctx.getNodeParameter('startTime', index) as string;
  const endTime = ctx.getNodeParameter('endTime', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/fundingRate',
    params: {
      symbol,
      limit,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
    },
  });

  return ctx.helpers.returnJsonArray(response);
}
```

- [ ] **Step 4: Create getTicker24h**

File: `nodes/BinanceFutures/actions/marketData/getTicker24h.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getTicker24hProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty for all symbols.',
    displayOptions: { show: { resource: ['marketData'], operation: ['getTicker24h'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/marketData/getTicker24h.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getTicker24h(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/ticker/24hr',
    params: { symbol: symbol || undefined },
  });

  return ctx.helpers.returnJsonArray(
    Array.isArray(response) ? response : [response],
  );
}
```

- [ ] **Step 5: Create getOrderBook**

File: `nodes/BinanceFutures/actions/marketData/getOrderBook.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getOrderBookProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['marketData'], operation: ['getOrderBook'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'options',
    displayOptions: { show: { resource: ['marketData'], operation: ['getOrderBook'] } },
    options: [
      { name: '5', value: 5 },
      { name: '10', value: 10 },
      { name: '20', value: 20 },
      { name: '50', value: 50 },
      { name: '100', value: 100 },
    ],
    default: 20,
  },
];
```

File: `nodes/BinanceFutures/actions/marketData/getOrderBook.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOrderBook(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const limit = ctx.getNodeParameter('limit', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/depth',
    params: { symbol, limit },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 6: Create getOpenInterest**

File: `nodes/BinanceFutures/actions/marketData/getOpenInterest.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getOpenInterestProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['marketData'], operation: ['getOpenInterest'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/marketData/getOpenInterest.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOpenInterest(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/openInterest',
    params: { symbol },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 7: Create index.ts for marketData**

File: `nodes/BinanceFutures/actions/marketData/index.ts`

```typescript
export { getKlines } from './getKlines.execute';
export { getMarkPrice } from './getMarkPrice.execute';
export { getFundingRate } from './getFundingRate.execute';
export { getTicker24h } from './getTicker24h.execute';
export { getOrderBook } from './getOrderBook.execute';
export { getOpenInterest } from './getOpenInterest.execute';

import { getKlinesProperties } from './getKlines.properties';
import { getMarkPriceProperties } from './getMarkPrice.properties';
import { getFundingRateProperties } from './getFundingRate.properties';
import { getTicker24hProperties } from './getTicker24h.properties';
import { getOrderBookProperties } from './getOrderBook.properties';
import { getOpenInterestProperties } from './getOpenInterest.properties';

export const marketDataProperties = [
  ...getKlinesProperties,
  ...getMarkPriceProperties,
  ...getFundingRateProperties,
  ...getTicker24hProperties,
  ...getOrderBookProperties,
  ...getOpenInterestProperties,
];
```

- [ ] **Step 8: Update BinanceFutures.node.ts to include marketData properties**

Add to the `properties` array in the node description:
```typescript
import { marketDataProperties } from './actions/marketData';
// In properties array:
...marketDataProperties,
```

- [ ] **Step 9: Build and verify**

```bash
npm run build
```

Expected: Compiles without errors

- [ ] **Step 10: Commit**

```bash
git add nodes/BinanceFutures/actions/marketData/
git commit -m "feat: add market data resource (klines, mark price, funding rate, ticker, order book, open interest)"
```

---

## Task 7: Account Resource (6 operations)

**Files:**
- Create: `nodes/BinanceFutures/actions/account/getAccountInfo.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/account/getBalance.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/account/getIncomeHistory.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/account/getTradeHistory.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/account/getLeverageBrackets.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/account/getCommissionRate.{properties,execute}.ts`
- Modify: `nodes/BinanceFutures/actions/account/index.ts`

- [ ] **Step 1: Create getAccountInfo**

File: `nodes/BinanceFutures/actions/account/getAccountInfo.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

// No extra fields needed — just resource + operation selection
export const getAccountInfoProperties: INodeProperties[] = [];
```

File: `nodes/BinanceFutures/actions/account/getAccountInfo.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getAccountInfo(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v3/account',
    signed: true,
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 2: Create getBalance**

File: `nodes/BinanceFutures/actions/account/getBalance.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getBalanceProperties: INodeProperties[] = [];
```

File: `nodes/BinanceFutures/actions/account/getBalance.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getBalance(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v3/balance',
    signed: true,
  });

  return ctx.helpers.returnJsonArray(response);
}
```

- [ ] **Step 3: Create getIncomeHistory**

File: `nodes/BinanceFutures/actions/account/getIncomeHistory.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getIncomeHistoryProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty for all.',
    displayOptions: { show: { resource: ['account'], operation: ['getIncomeHistory'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Income Type',
    name: 'incomeType',
    type: 'options',
    displayOptions: { show: { resource: ['account'], operation: ['getIncomeHistory'] } },
    options: [
      { name: 'All', value: '' },
      { name: 'Realized PnL', value: 'REALIZED_PNL' },
      { name: 'Funding Fee', value: 'FUNDING_FEE' },
      { name: 'Commission', value: 'COMMISSION' },
      { name: 'Transfer', value: 'TRANSFER' },
      { name: 'Insurance Clear', value: 'INSURANCE_CLEAR' },
      { name: 'Welcome Bonus', value: 'WELCOME_BONUS' },
      { name: 'Internal Transfer', value: 'INTERNAL_TRANSFER' },
      { name: 'Delivered Settlement', value: 'DELIVERED_SETTLEMENT' },
    ],
    default: '',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['account'], operation: ['getIncomeHistory'] } },
    typeOptions: { minValue: 1, maxValue: 1000 },
    default: 100,
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['account'], operation: ['getIncomeHistory'] } },
    default: '',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['account'], operation: ['getIncomeHistory'] } },
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/account/getIncomeHistory.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getIncomeHistory(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index, '') as string;
  const incomeType = ctx.getNodeParameter('incomeType', index, '') as string;
  const limit = ctx.getNodeParameter('limit', index) as number;
  const startTime = ctx.getNodeParameter('startTime', index) as string;
  const endTime = ctx.getNodeParameter('endTime', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/income',
    signed: true,
    params: {
      symbol: symbol || undefined,
      incomeType: incomeType || undefined,
      limit,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
    },
  });

  return ctx.helpers.returnJsonArray(response);
}
```

- [ ] **Step 4: Create getTradeHistory**

File: `nodes/BinanceFutures/actions/account/getTradeHistory.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getTradeHistoryProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['account'], operation: ['getTradeHistory'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Order ID',
    name: 'orderId',
    type: 'string',
    displayOptions: { show: { resource: ['account'], operation: ['getTradeHistory'] } },
    default: '',
    description: 'Filter trades by specific order ID. Leave empty for all trades.',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['account'], operation: ['getTradeHistory'] } },
    typeOptions: { minValue: 1, maxValue: 1000 },
    default: 50,
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['account'], operation: ['getTradeHistory'] } },
    default: '',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['account'], operation: ['getTradeHistory'] } },
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/account/getTradeHistory.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getTradeHistory(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const orderId = ctx.getNodeParameter('orderId', index, '') as number | string;
  const limit = ctx.getNodeParameter('limit', index) as number;
  const startTime = ctx.getNodeParameter('startTime', index) as string;
  const endTime = ctx.getNodeParameter('endTime', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/userTrades',
    signed: true,
    params: {
      symbol,
      orderId: orderId || undefined,
      limit,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
    },
  });

  return ctx.helpers.returnJsonArray(response);
}
```

- [ ] **Step 5: Create getLeverageBrackets**

File: `nodes/BinanceFutures/actions/account/getLeverageBrackets.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getLeverageBracketsProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty for all.',
    displayOptions: { show: { resource: ['account'], operation: ['getLeverageBrackets'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/account/getLeverageBrackets.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getLeverageBrackets(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/leverageBracket',
    signed: true,
    params: { symbol: symbol || undefined },
  });

  return ctx.helpers.returnJsonArray(
    Array.isArray(response) ? response : [response],
  );
}
```

- [ ] **Step 6: Create getCommissionRate**

File: `nodes/BinanceFutures/actions/account/getCommissionRate.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getCommissionRateProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['account'], operation: ['getCommissionRate'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/account/getCommissionRate.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getCommissionRate(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/commissionRate',
    signed: true,
    params: { symbol },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 7: Create index.ts**

File: `nodes/BinanceFutures/actions/account/index.ts`

```typescript
export { getAccountInfo } from './getAccountInfo.execute';
export { getBalance } from './getBalance.execute';
export { getIncomeHistory } from './getIncomeHistory.execute';
export { getTradeHistory } from './getTradeHistory.execute';
export { getLeverageBrackets } from './getLeverageBrackets.execute';
export { getCommissionRate } from './getCommissionRate.execute';

import { getAccountInfoProperties } from './getAccountInfo.properties';
import { getBalanceProperties } from './getBalance.properties';
import { getIncomeHistoryProperties } from './getIncomeHistory.properties';
import { getTradeHistoryProperties } from './getTradeHistory.properties';
import { getLeverageBracketsProperties } from './getLeverageBrackets.properties';
import { getCommissionRateProperties } from './getCommissionRate.properties';

export const accountProperties = [
  ...getAccountInfoProperties,
  ...getBalanceProperties,
  ...getIncomeHistoryProperties,
  ...getTradeHistoryProperties,
  ...getLeverageBracketsProperties,
  ...getCommissionRateProperties,
];
```

- [ ] **Step 8: Update node description with account properties, build, commit**

Add `accountProperties` to the node's properties array. Then:

```bash
npm run build
git add nodes/BinanceFutures/actions/account/
git commit -m "feat: add account resource (account info, balance, income, trades, leverage brackets, commission)"
```

---

## Task 8: Position Resource (3 operations)

**Files:**
- Create: `nodes/BinanceFutures/actions/position/getPositions.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/position/changeLeverage.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/position/changeMarginType.{properties,execute}.ts`
- Modify: `nodes/BinanceFutures/actions/position/index.ts`

- [ ] **Step 1: Create getPositions**

File: `nodes/BinanceFutures/actions/position/getPositions.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getPositionsProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty for all.',
    displayOptions: { show: { resource: ['position'], operation: ['getPositions'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/position/getPositions.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getPositions(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v3/positionRisk',
    signed: true,
    params: { symbol: symbol || undefined },
  });

  return ctx.helpers.returnJsonArray(response);
}
```

- [ ] **Step 2: Create changeLeverage**

File: `nodes/BinanceFutures/actions/position/changeLeverage.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const changeLeverageProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['position'], operation: ['changeLeverage'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Leverage',
    name: 'leverage',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['position'], operation: ['changeLeverage'] } },
    typeOptions: { minValue: 1, maxValue: 125 },
    default: 20,
  },
];
```

File: `nodes/BinanceFutures/actions/position/changeLeverage.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function changeLeverage(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const leverage = ctx.getNodeParameter('leverage', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'POST',
    path: '/fapi/v1/leverage',
    signed: true,
    params: { symbol, leverage },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 3: Create changeMarginType**

File: `nodes/BinanceFutures/actions/position/changeMarginType.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const changeMarginTypeProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['position'], operation: ['changeMarginType'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Margin Type',
    name: 'marginType',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['position'], operation: ['changeMarginType'] } },
    options: [
      { name: 'Isolated', value: 'ISOLATED' },
      { name: 'Cross', value: 'CROSSED' },
    ],
    default: 'ISOLATED',
  },
];
```

File: `nodes/BinanceFutures/actions/position/changeMarginType.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function changeMarginType(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const marginType = ctx.getNodeParameter('marginType', index) as string;

  try {
    const response = await binanceRequest.call(ctx, {
      method: 'POST',
      path: '/fapi/v1/marginType',
      signed: true,
      params: { symbol, marginType },
    });
    return ctx.helpers.returnJsonArray([response]);
  } catch (error: any) {
    // -4046: No need to change margin type (already set)
    if (error.message?.includes('-4046')) {
      return ctx.helpers.returnJsonArray([{
        success: true,
        message: `Margin type already set to ${marginType}`,
      }]);
    }
    throw error;
  }
}
```

- [ ] **Step 4: Create index.ts, update node, build, commit**

File: `nodes/BinanceFutures/actions/position/index.ts`

```typescript
export { getPositions } from './getPositions.execute';
export { changeLeverage } from './changeLeverage.execute';
export { changeMarginType } from './changeMarginType.execute';

import { getPositionsProperties } from './getPositions.properties';
import { changeLeverageProperties } from './changeLeverage.properties';
import { changeMarginTypeProperties } from './changeMarginType.properties';

export const positionProperties = [
  ...getPositionsProperties,
  ...changeLeverageProperties,
  ...changeMarginTypeProperties,
];
```

```bash
npm run build
git add nodes/BinanceFutures/actions/position/
git commit -m "feat: add position resource (get positions, change leverage, change margin type)"
```

---

## Task 9: Order Resource (8 operations)

**Files:**
- Create all 8 operations under `nodes/BinanceFutures/actions/order/`
- Modify: `nodes/BinanceFutures/actions/order/index.ts`

- [ ] **Step 1: Create placeOrder (the most complex operation)**

File: `nodes/BinanceFutures/actions/order/placeOrder.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const placeOrderProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['order'], operation: ['placeOrder'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Side',
    name: 'side',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['placeOrder'] } },
    options: [
      { name: 'Buy', value: 'BUY' },
      { name: 'Sell', value: 'SELL' },
    ],
    default: 'BUY',
  },
  {
    displayName: 'Order Type',
    name: 'orderType',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['placeOrder'] } },
    options: [
      { name: 'Market', value: 'MARKET' },
      { name: 'Limit', value: 'LIMIT' },
      { name: 'Stop', value: 'STOP' },
      { name: 'Stop Market', value: 'STOP_MARKET' },
      { name: 'Take Profit', value: 'TAKE_PROFIT' },
      { name: 'Take Profit Market', value: 'TAKE_PROFIT_MARKET' },
      { name: 'Trailing Stop Market', value: 'TRAILING_STOP_MARKET' },
    ],
    default: 'MARKET',
  },
  {
    displayName: 'Quantity',
    name: 'quantity',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['placeOrder'] } },
    typeOptions: { numberPrecision: 8 },
    default: 0,
  },
  {
    displayName: 'Price',
    name: 'price',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['placeOrder'],
        orderType: ['LIMIT', 'STOP', 'TAKE_PROFIT'],
      },
    },
    typeOptions: { numberPrecision: 8 },
    default: 0,
  },
  {
    displayName: 'Stop Price',
    name: 'stopPrice',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['placeOrder'],
        orderType: ['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET'],
      },
    },
    typeOptions: { numberPrecision: 8 },
    default: 0,
    description: 'Trigger price for conditional orders',
  },
  {
    displayName: 'Callback Rate (%)',
    name: 'callbackRate',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['placeOrder'],
        orderType: ['TRAILING_STOP_MARKET'],
      },
    },
    typeOptions: { minValue: 0.1, maxValue: 5, numberPrecision: 1 },
    default: 1,
    description: 'Trailing stop callback rate (0.1% - 5%)',
  },
  {
    displayName: 'Time in Force',
    name: 'timeInForce',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['placeOrder'],
        orderType: ['LIMIT', 'STOP', 'TAKE_PROFIT'],
      },
    },
    options: [
      { name: 'GTC (Good Till Cancel)', value: 'GTC' },
      { name: 'IOC (Immediate or Cancel)', value: 'IOC' },
      { name: 'FOK (Fill or Kill)', value: 'FOK' },
      { name: 'GTX (Post Only)', value: 'GTX' },
    ],
    default: 'GTC',
  },
  {
    displayName: 'Working Type',
    name: 'workingType',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['order'],
        operation: ['placeOrder'],
        orderType: ['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET', 'TRAILING_STOP_MARKET'],
      },
    },
    options: [
      { name: 'Mark Price', value: 'MARK_PRICE' },
      { name: 'Contract Price', value: 'CONTRACT_PRICE' },
    ],
    default: 'MARK_PRICE',
  },
  {
    displayName: 'Reduce Only',
    name: 'reduceOnly',
    type: 'boolean',
    displayOptions: { show: { resource: ['order'], operation: ['placeOrder'] } },
    default: false,
  },
  {
    displayName: 'Client Order ID',
    name: 'newClientOrderId',
    type: 'string',
    displayOptions: { show: { resource: ['order'], operation: ['placeOrder'] } },
    default: '',
    description: 'Optional custom order ID for tracking',
  },
];
```

File: `nodes/BinanceFutures/actions/order/placeOrder.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function placeOrder(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const side = ctx.getNodeParameter('side', index) as string;
  const orderType = ctx.getNodeParameter('orderType', index) as string;
  const quantity = ctx.getNodeParameter('quantity', index) as number;

  const params: Record<string, any> = {
    symbol,
    side,
    type: orderType,
    quantity: String(quantity),
    positionSide: 'BOTH',
    newOrderRespType: 'RESULT',
  };

  // Conditional fields based on order type
  if (['LIMIT', 'STOP', 'TAKE_PROFIT'].includes(orderType)) {
    params.price = String(ctx.getNodeParameter('price', index) as number);
    params.timeInForce = ctx.getNodeParameter('timeInForce', index) as string;
  }

  if (['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET'].includes(orderType)) {
    params.stopPrice = String(ctx.getNodeParameter('stopPrice', index) as number);
  }

  if (orderType === 'TRAILING_STOP_MARKET') {
    params.callbackRate = String(ctx.getNodeParameter('callbackRate', index) as number);
  }

  if (['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET', 'TRAILING_STOP_MARKET'].includes(orderType)) {
    params.workingType = ctx.getNodeParameter('workingType', index) as string;
  }

  const reduceOnly = ctx.getNodeParameter('reduceOnly', index) as boolean;
  if (reduceOnly) {
    params.reduceOnly = 'true';
  }

  const clientOrderId = ctx.getNodeParameter('newClientOrderId', index, '') as string;
  if (clientOrderId) {
    params.newClientOrderId = clientOrderId;
  }

  const response = await binanceRequest.call(ctx, {
    method: 'POST',
    path: '/fapi/v1/order',
    signed: true,
    params,
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 2: Create placeBatchOrders**

File: `nodes/BinanceFutures/actions/order/placeBatchOrders.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const placeBatchOrdersProperties: INodeProperties[] = [
  {
    displayName: 'Orders',
    name: 'orders',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true, maxValue: 5 },
    displayOptions: { show: { resource: ['order'], operation: ['placeBatchOrders'] } },
    default: {},
    options: [
      {
        displayName: 'Order',
        name: 'order',
        values: [
          {
            displayName: 'Symbol',
            name: 'symbol',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Side',
            name: 'side',
            type: 'options',
            options: [
              { name: 'Buy', value: 'BUY' },
              { name: 'Sell', value: 'SELL' },
            ],
            default: 'BUY',
          },
          {
            displayName: 'Order Type',
            name: 'type',
            type: 'options',
            options: [
              { name: 'Market', value: 'MARKET' },
              { name: 'Limit', value: 'LIMIT' },
              { name: 'Stop', value: 'STOP' },
              { name: 'Stop Market', value: 'STOP_MARKET' },
              { name: 'Take Profit', value: 'TAKE_PROFIT' },
              { name: 'Take Profit Market', value: 'TAKE_PROFIT_MARKET' },
              { name: 'Trailing Stop Market', value: 'TRAILING_STOP_MARKET' },
            ],
            default: 'MARKET',
          },
          {
            displayName: 'Quantity',
            name: 'quantity',
            type: 'number',
            typeOptions: { numberPrecision: 8 },
            default: 0,
          },
          {
            displayName: 'Price',
            name: 'price',
            type: 'number',
            typeOptions: { numberPrecision: 8 },
            default: 0,
            description: 'Required for LIMIT, STOP, TAKE_PROFIT',
          },
          {
            displayName: 'Stop Price',
            name: 'stopPrice',
            type: 'number',
            typeOptions: { numberPrecision: 8 },
            default: 0,
            description: 'Required for STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET',
          },
          {
            displayName: 'Time in Force',
            name: 'timeInForce',
            type: 'options',
            options: [
              { name: 'GTC', value: 'GTC' },
              { name: 'IOC', value: 'IOC' },
              { name: 'FOK', value: 'FOK' },
              { name: 'GTX', value: 'GTX' },
            ],
            default: 'GTC',
            description: 'Required for LIMIT, STOP, TAKE_PROFIT',
          },
          {
            displayName: 'Reduce Only',
            name: 'reduceOnly',
            type: 'boolean',
            default: false,
          },
        ],
      },
    ],
  },
];
```

File: `nodes/BinanceFutures/actions/order/placeBatchOrders.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function placeBatchOrders(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const ordersData = ctx.getNodeParameter('orders', index) as any;
  const orders = ordersData.order || [];

  const batchOrders = orders.map((o: any) => {
    const order: Record<string, any> = {
      symbol: o.symbol,
      side: o.side,
      type: o.type,
      quantity: String(o.quantity),
      positionSide: 'BOTH',
      newOrderRespType: 'RESULT',
    };

    if (['LIMIT', 'STOP', 'TAKE_PROFIT'].includes(o.type) && o.price) {
      order.price = String(o.price);
      order.timeInForce = o.timeInForce || 'GTC';
    }

    if (['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET'].includes(o.type) && o.stopPrice) {
      order.stopPrice = String(o.stopPrice);
    }

    if (o.reduceOnly) {
      order.reduceOnly = 'true';
    }

    return order;
  });

  const response = await binanceRequest.call(ctx, {
    method: 'POST',
    path: '/fapi/v1/batchOrders',
    signed: true,
    params: {
      batchOrders: JSON.stringify(batchOrders),
    },
  });

  // Output one item per order result (handles partial failures)
  const results = Array.isArray(response) ? response : [response];
  return results.map((r: any) => ({ json: r }));
}
```

- [ ] **Step 3: Create modifyOrder**

File: `nodes/BinanceFutures/actions/order/modifyOrder.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const modifyOrderProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['order'], operation: ['modifyOrder'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Order ID',
    name: 'orderId',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['modifyOrder'] } },
    default: 0,
  },
  {
    displayName: 'Side',
    name: 'side',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['modifyOrder'] } },
    options: [
      { name: 'Buy', value: 'BUY' },
      { name: 'Sell', value: 'SELL' },
    ],
    default: 'BUY',
    description: 'Required by Binance for identification (not modifiable)',
  },
  {
    displayName: 'Quantity',
    name: 'quantity',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['modifyOrder'] } },
    typeOptions: { numberPrecision: 8 },
    default: 0,
  },
  {
    displayName: 'Price',
    name: 'price',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['modifyOrder'] } },
    typeOptions: { numberPrecision: 8 },
    default: 0,
  },
];
```

File: `nodes/BinanceFutures/actions/order/modifyOrder.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function modifyOrder(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const orderId = ctx.getNodeParameter('orderId', index) as number;
  const side = ctx.getNodeParameter('side', index) as string;
  const quantity = ctx.getNodeParameter('quantity', index) as number;
  const price = ctx.getNodeParameter('price', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'PUT',
    path: '/fapi/v1/order',
    signed: true,
    params: {
      symbol,
      orderId,
      side,
      quantity: String(quantity),
      price: String(price),
    },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 4: Create cancelOrder**

File: `nodes/BinanceFutures/actions/order/cancelOrder.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const cancelOrderProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['order'], operation: ['cancelOrder'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Order ID',
    name: 'orderId',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['cancelOrder'] } },
    default: 0,
  },
];
```

File: `nodes/BinanceFutures/actions/order/cancelOrder.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function cancelOrder(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const orderId = ctx.getNodeParameter('orderId', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'DELETE',
    path: '/fapi/v1/order',
    signed: true,
    params: { symbol, orderId },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 5: Create cancelAllOrders**

File: `nodes/BinanceFutures/actions/order/cancelAllOrders.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const cancelAllOrdersProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['order'], operation: ['cancelAllOrders'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/order/cancelAllOrders.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function cancelAllOrders(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'DELETE',
    path: '/fapi/v1/allOpenOrders',
    signed: true,
    params: { symbol },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 6: Create getOrder, getOpenOrders, getAllOrders**

File: `nodes/BinanceFutures/actions/order/getOrder.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getOrderProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['order'], operation: ['getOrder'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Order ID',
    name: 'orderId',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['order'], operation: ['getOrder'] } },
    default: 0,
  },
];
```

File: `nodes/BinanceFutures/actions/order/getOrder.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOrder(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const orderId = ctx.getNodeParameter('orderId', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/order',
    signed: true,
    params: { symbol, orderId },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

File: `nodes/BinanceFutures/actions/order/getOpenOrders.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getOpenOrdersProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty for all.',
    displayOptions: { show: { resource: ['order'], operation: ['getOpenOrders'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/order/getOpenOrders.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOpenOrders(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/openOrders',
    signed: true,
    params: { symbol: symbol || undefined },
  });

  return ctx.helpers.returnJsonArray(response);
}
```

File: `nodes/BinanceFutures/actions/order/getAllOrders.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getAllOrdersProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['order'], operation: ['getAllOrders'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['order'], operation: ['getAllOrders'] } },
    typeOptions: { minValue: 1, maxValue: 1000 },
    default: 50,
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['order'], operation: ['getAllOrders'] } },
    default: '',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['order'], operation: ['getAllOrders'] } },
    default: '',
  },
];
```

File: `nodes/BinanceFutures/actions/order/getAllOrders.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getAllOrders(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const limit = ctx.getNodeParameter('limit', index) as number;
  const startTime = ctx.getNodeParameter('startTime', index) as string;
  const endTime = ctx.getNodeParameter('endTime', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/allOrders',
    signed: true,
    params: {
      symbol,
      limit,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
    },
  });

  return ctx.helpers.returnJsonArray(response);
}
```

- [ ] **Step 7: Create order index.ts**

File: `nodes/BinanceFutures/actions/order/index.ts`

```typescript
export { placeOrder } from './placeOrder.execute';
export { placeBatchOrders } from './placeBatchOrders.execute';
export { modifyOrder } from './modifyOrder.execute';
export { cancelOrder } from './cancelOrder.execute';
export { cancelAllOrders } from './cancelAllOrders.execute';
export { getOrder } from './getOrder.execute';
export { getOpenOrders } from './getOpenOrders.execute';
export { getAllOrders } from './getAllOrders.execute';

import { placeOrderProperties } from './placeOrder.properties';
import { placeBatchOrdersProperties } from './placeBatchOrders.properties';
import { modifyOrderProperties } from './modifyOrder.properties';
import { cancelOrderProperties } from './cancelOrder.properties';
import { cancelAllOrdersProperties } from './cancelAllOrders.properties';
import { getOrderProperties } from './getOrder.properties';
import { getOpenOrdersProperties } from './getOpenOrders.properties';
import { getAllOrdersProperties } from './getAllOrders.properties';

export const orderProperties = [
  ...placeOrderProperties,
  ...placeBatchOrdersProperties,
  ...modifyOrderProperties,
  ...cancelOrderProperties,
  ...cancelAllOrdersProperties,
  ...getOrderProperties,
  ...getOpenOrdersProperties,
  ...getAllOrdersProperties,
];
```

- [ ] **Step 8: Update node, build, commit**

```bash
npm run build
git add nodes/BinanceFutures/actions/order/
git commit -m "feat: add order resource (place, batch, modify, cancel, get orders)"
```

---

## Task 10: Wallet Resource (3 operations)

**Files:**
- Create: `nodes/BinanceFutures/actions/wallet/transfer.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/wallet/withdraw.{properties,execute}.ts`
- Create: `nodes/BinanceFutures/actions/wallet/getTransferHistory.{properties,execute}.ts`
- Modify: `nodes/BinanceFutures/actions/wallet/index.ts`

- [ ] **Step 1: Create transfer**

File: `nodes/BinanceFutures/actions/wallet/transfer.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const transferProperties: INodeProperties[] = [
  {
    displayName: 'Transfer Type',
    name: 'transferType',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['transfer'] } },
    options: [
      { name: 'Spot → Futures', value: 'MAIN_UMFUTURE' },
      { name: 'Futures → Spot', value: 'UMFUTURE_MAIN' },
    ],
    default: 'MAIN_UMFUTURE',
  },
  {
    displayName: 'Asset',
    name: 'asset',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['transfer'] } },
    default: 'USDT',
    description: 'Asset to transfer (e.g., USDT, BUSD)',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['transfer'] } },
    typeOptions: { numberPrecision: 8 },
    default: 0,
  },
];
```

File: `nodes/BinanceFutures/actions/wallet/transfer.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function transfer(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const type = ctx.getNodeParameter('transferType', index) as string;
  const asset = ctx.getNodeParameter('asset', index) as string;
  const amount = ctx.getNodeParameter('amount', index) as number;

  // Note: SAPI endpoints (wallet operations) are not available on testnet.
  // They only work with production credentials.
  const response = await binanceRequest.call(ctx, {
    method: 'POST',
    path: '/sapi/v1/asset/transfer',
    signed: true,
    baseUrlType: 'sapi',
    params: { type, asset, amount: String(amount) },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 2: Create withdraw**

File: `nodes/BinanceFutures/actions/wallet/withdraw.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const withdrawProperties: INodeProperties[] = [
  {
    displayName: 'Coin',
    name: 'coin',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    default: 'USDT',
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    default: '',
  },
  {
    displayName: 'Network',
    name: 'network',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    default: '',
    description: 'Network to use (e.g., ETH, BSC, TRX, SOL)',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    typeOptions: { numberPrecision: 8 },
    default: 0,
  },
  {
    displayName: 'Address Tag',
    name: 'addressTag',
    type: 'string',
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    default: '',
    description: 'Memo/tag for coins that require it (e.g., XRP, XLM)',
  },
];
```

File: `nodes/BinanceFutures/actions/wallet/withdraw.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function withdraw(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const coin = ctx.getNodeParameter('coin', index) as string;
  const address = ctx.getNodeParameter('address', index) as string;
  const network = ctx.getNodeParameter('network', index) as string;
  const amount = ctx.getNodeParameter('amount', index) as number;
  const addressTag = ctx.getNodeParameter('addressTag', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'POST',
    path: '/sapi/v1/capital/withdraw/apply',
    signed: true,
    baseUrlType: 'sapi',
    params: {
      coin,
      address,
      network,
      amount: String(amount),
      addressTag: addressTag || undefined,
    },
  });

  return ctx.helpers.returnJsonArray([response]);
}
```

- [ ] **Step 3: Create getTransferHistory**

File: `nodes/BinanceFutures/actions/wallet/getTransferHistory.properties.ts`

```typescript
import { INodeProperties } from 'n8n-workflow';

export const getTransferHistoryProperties: INodeProperties[] = [
  {
    displayName: 'Transfer Type',
    name: 'transferType',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['getTransferHistory'] } },
    options: [
      { name: 'Spot → Futures', value: 'MAIN_UMFUTURE' },
      { name: 'Futures → Spot', value: 'UMFUTURE_MAIN' },
    ],
    default: 'MAIN_UMFUTURE',
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['wallet'], operation: ['getTransferHistory'] } },
    default: '',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['wallet'], operation: ['getTransferHistory'] } },
    default: '',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['wallet'], operation: ['getTransferHistory'] } },
    typeOptions: { minValue: 1, maxValue: 100 },
    default: 10,
  },
];
```

File: `nodes/BinanceFutures/actions/wallet/getTransferHistory.execute.ts`

```typescript
import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getTransferHistory(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const type = ctx.getNodeParameter('transferType', index) as string;
  const startTime = ctx.getNodeParameter('startTime', index) as string;
  const endTime = ctx.getNodeParameter('endTime', index) as string;
  const limit = ctx.getNodeParameter('limit', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/sapi/v1/asset/transfer',
    signed: true,
    baseUrlType: 'sapi',
    params: {
      type,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
      size: limit,
    },
  });

  const rows = response.rows || [];
  return ctx.helpers.returnJsonArray(rows);
}
```

- [ ] **Step 4: Create index.ts, build, commit**

File: `nodes/BinanceFutures/actions/wallet/index.ts`

```typescript
export { transfer } from './transfer.execute';
export { withdraw } from './withdraw.execute';
export { getTransferHistory } from './getTransferHistory.execute';

import { transferProperties } from './transfer.properties';
import { withdrawProperties } from './withdraw.properties';
import { getTransferHistoryProperties } from './getTransferHistory.properties';

export const walletProperties = [
  ...transferProperties,
  ...withdrawProperties,
  ...getTransferHistoryProperties,
];
```

```bash
npm run build
git add nodes/BinanceFutures/actions/wallet/
git commit -m "feat: add wallet resource (transfer spot/futures, withdraw, transfer history)"
```

---

## Task 11: Finalize Main Node (wire all properties)

**Files:**
- Modify: `nodes/BinanceFutures/BinanceFutures.node.ts`

- [ ] **Step 1: Update node class with all properties**

Replace `BinanceFutures.node.ts` with the final version importing all resource properties:

```typescript
import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { IExecuteFunctions } from 'n8n-core';

import { getSymbols } from './methods/loadOptions';
import { router } from './actions/router';

import {
  resourceProperty,
  orderOperationProperty,
  positionOperationProperty,
  accountOperationProperty,
  walletOperationProperty,
  marketDataOperationProperty,
} from './actions/resources';

import { orderProperties } from './actions/order';
import { positionProperties } from './actions/position';
import { accountProperties } from './actions/account';
import { walletProperties } from './actions/wallet';
import { marketDataProperties } from './actions/marketData';

export class BinanceFutures implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Binance Futures',
    name: 'binanceFutures',
    description: 'Trade on Binance USDS-Margined Futures',
    icon: 'file:BinanceFutures.svg',
    version: 1,
    inputs: ['main'],
    outputs: ['main'],
    defaults: {
      name: 'Binance Futures',
    },
    group: ['Binance'],
    credentials: [{ name: 'binanceFuturesApi', required: true }],
    properties: [
      resourceProperty,
      orderOperationProperty,
      positionOperationProperty,
      accountOperationProperty,
      walletOperationProperty,
      marketDataOperationProperty,
      ...orderProperties,
      ...positionProperties,
      ...accountProperties,
      ...walletProperties,
      ...marketDataProperties,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return router.call(this);
  }

  methods = {
    loadOptions: {
      getSymbols,
    },
  };
}
```

- [ ] **Step 2: Build and verify all operations**

```bash
npm run build
```

Expected: Compiles without errors, `dist/` contains all compiled files

- [ ] **Step 3: Commit**

```bash
git add nodes/BinanceFutures/BinanceFutures.node.ts
git commit -m "feat: wire all resource properties into main node class"
```

---

## Task 12: Trigger Node (User Data Stream)

**Files:**
- Create: `nodes/BinanceFutures/triggers/userDataStream.trigger.ts`
- Create: `nodes/BinanceFutures/BinanceFuturesTrigger.node.ts`

- [ ] **Step 1: Create the trigger implementation**

File: `nodes/BinanceFutures/triggers/userDataStream.trigger.ts`

```typescript
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
```

- [ ] **Step 2: Create trigger node class**

File: `nodes/BinanceFutures/BinanceFuturesTrigger.node.ts`

```typescript
import { ITriggerFunctions } from 'n8n-core';
import { INodeType, INodeTypeDescription, ITriggerResponse } from 'n8n-workflow';
import { userDataStreamTrigger } from './triggers/userDataStream.trigger';

export class BinanceFuturesTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Binance Futures Trigger',
    name: 'binanceFuturesTrigger',
    description: 'Listen to Binance Futures account events in real-time',
    icon: 'file:BinanceFutures.svg',
    version: 1,
    inputs: [],
    outputs: ['main'],
    defaults: {
      name: 'Binance Futures Trigger',
    },
    group: ['trigger', 'Binance'],
    credentials: [{ name: 'binanceFuturesApi', required: true }],
    properties: [
      {
        displayName: 'Event Types',
        name: 'eventTypes',
        type: 'multiOptions',
        required: true,
        options: [
          {
            name: 'Order Update',
            value: 'orderUpdate',
            description: 'Order status changes (NEW, FILLED, CANCELED, etc.)',
          },
          {
            name: 'Account Update',
            value: 'accountUpdate',
            description: 'Balance and position changes',
          },
          {
            name: 'Margin Call',
            value: 'marginCall',
            description: 'Low margin alert',
          },
          {
            name: 'Account Config Update',
            value: 'accountConfigUpdate',
            description: 'Leverage or margin type changes',
          },
        ],
        default: ['orderUpdate'],
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse | undefined> {
    return userDataStreamTrigger.call(this);
  }
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

Expected: Compiles without errors

- [ ] **Step 4: Commit**

```bash
git add nodes/BinanceFutures/triggers/ nodes/BinanceFutures/BinanceFuturesTrigger.node.ts
git commit -m "feat: add User Data Stream trigger node with reconnection"
```

---

## Task 13: Final Build, Cleanup & Verification

**Files:**
- Modify: `nodes/BinanceFutures/BinanceFutures.node.ts` (final adjustments)
- Verify: all files compile and dist/ is correct

- [ ] **Step 1: Clean build**

```bash
npm run prebuild
npm run build
```

Expected: No errors. `dist/` directory contains:
- `dist/credentials/BinanceFuturesApi.credentials.js`
- `dist/nodes/BinanceFutures/BinanceFutures.node.js`
- `dist/nodes/BinanceFutures/BinanceFuturesTrigger.node.js`
- `dist/nodes/BinanceFutures/BinanceFutures.svg`
- All action and helper files compiled

- [ ] **Step 2: Verify dist structure**

```bash
ls -R dist/
```

Expected: All .js and .d.ts files present for every .ts source file

- [ ] **Step 3: Verify package.json n8n paths match dist**

Check that `package.json` n8n.credentials and n8n.nodes paths match actual files in dist:
- `dist/credentials/BinanceFuturesApi.credentials.js` ✓
- `dist/nodes/BinanceFutures/BinanceFutures.node.js` ✓
- `dist/nodes/BinanceFutures/BinanceFuturesTrigger.node.js` ✓

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Binance USDS-Margined Futures n8n node v1.0.0"
```

---

## Testing Checklist (Manual — against Binance Testnet)

After building, install the node in n8n and test with testnet credentials:

- [ ] Credentials: Create with testnet API key, verify connection test passes
- [ ] Market Data: Get Klines for BTCUSDT, verify candle data returned
- [ ] Market Data: Get Ticker 24h, verify price data
- [ ] Account: Get Account Info, verify balance shown
- [ ] Account: Get Balance, verify USDT balance
- [ ] Position: Change Leverage to 10x on BTCUSDT
- [ ] Position: Change Margin Type to ISOLATED on BTCUSDT
- [ ] Order: Place MARKET BUY order for BTCUSDT
- [ ] Order: Get Open Orders
- [ ] Order: Place LIMIT SELL order for BTCUSDT
- [ ] Order: Cancel Order by ID
- [ ] Account: Get Trade History filtered by Order ID
- [ ] Trigger: Activate workflow with Order Update event, place order, verify trigger fires
