# n8n Binance USDS-Margined Futures Node — Design Spec

## Overview

Refactored n8n community node for Binance USDS-Margined Futures trading. Based on the existing `n8n-nodes-binance` repo structure but rebuilt with direct HTTP calls (no third-party wrapper libraries), using V3 endpoints where available, and supporting all order types including conditional orders.

**Goal:** Zero-code usage in n8n. Every operation is fully configurable via dropdowns, toggles, and fields that accept both manual input and n8n expressions/variables.

## Decisions

- **Scope:** Futures USDS-Margined only. Spot is removed from this node (users can keep the original repo for spot). This is a dedicated Futures node.
- **Approach:** Refactor existing repo — keep modular actions/properties/execute pattern, replace `binance-api-node` with native HTTP via `this.helpers.httpRequest`.
- **Position Mode:** One-way only (no hedge mode). If user's account is in hedge mode, the node surfaces a clear error message suggesting they switch to one-way mode via Binance settings.
- **Dependencies:** Zero external dependencies. Uses Node.js `crypto` for HMAC-SHA256 and n8n's native `httpRequest`. WebSocket trigger uses `ws` (already bundled in n8n-core).
- **Testnet:** Supported via toggle in credentials.
- **API versions:** Uses V3 endpoints for account/balance/positions (latest). Other endpoints use V1 as that is their current version on Binance. This is not inconsistent — Binance versions each endpoint group independently.
- **Conditional orders (STOP, TAKE_PROFIT, TRAILING_STOP):** Since Dec 2025, Binance migrated these to the Algo Service. They are placed via `/fapi/v1/order` with the corresponding type but may return error `-4120` if the API enforces the new Algo endpoints. The node will attempt `/fapi/v1/order` first and, if `-4120` is returned, the error message will instruct the user to check Binance's latest documentation. This approach keeps the node simpler while handling the transition period.

## Credentials: `BinanceFuturesApi`

| Field | Type | Notes |
|---|---|---|
| API Key | string (password) | Required |
| API Secret | string (password) | Required |
| Environment | dropdown | `Production` / `Testnet` |

**Base URLs:**

| Environment | REST | WebSocket |
|---|---|---|
| Production | `https://fapi.binance.com` | `wss://fstream.binance.com` |
| Testnet | `https://testnet.binancefuture.com` | `wss://stream.binancefuture.com` |

**Connection test:** `GET /fapi/v3/account` (authenticated — validates both connectivity AND credential validity, unlike ping which is unauthenticated).

## Authentication Helper: `binanceRequest`

Centralized function handling all API calls:

1. Receives `method`, `path`, `params`, `signed` (boolean), `baseUrlOverride` (optional — for SAPI endpoints that use `api.binance.com`)
2. Resolves base URL from credentials environment setting
3. If `signed`: appends `timestamp` (ms) and `recvWindow` (default 5000ms), generates HMAC-SHA256 `signature` over query string with API Secret, adds `X-MBX-APIKEY` header
4. If not `signed`: adds `X-MBX-APIKEY` header only for MARKET_DATA/USER_STREAM endpoints
5. Uses `this.helpers.httpRequest` (n8n native)
6. Returns parsed JSON response

### Error Handling

- Binance API errors (e.g., `{"code": -1021, "msg": "..."}`) are caught and re-thrown as `NodeApiError` with the Binance error message, making them visible in n8n's error output.
- HTTP 429 (rate limit exceeded): surfaces clear error "Binance rate limit exceeded. Reduce request frequency."
- HTTP 418 (IP banned): surfaces error "IP temporarily banned by Binance. Wait before retrying."
- No automatic retries — n8n has built-in retry-on-error per node, so we defer to that mechanism rather than implementing our own.
- Each operation wraps execution in `this.helpers.returnJsonArray()` and respects `this.continueOnFail()` for error tolerance in workflows.

## Node: `BinanceFutures`

### Resources and Operations

#### Resource: Order

| Operation | Endpoint | Method | Signed | Fields |
|---|---|---|---|---|
| Place Order | `/fapi/v1/order` | POST | Yes | Symbol, Side (BUY/SELL), Order Type (MARKET/LIMIT/STOP/STOP_MARKET/TAKE_PROFIT/TAKE_PROFIT_MARKET/TRAILING_STOP_MARKET), Quantity, Price (conditional), Stop Price (conditional), Callback Rate (conditional), Time in Force (conditional), Working Type (conditional), Reduce Only, Client Order ID (optional) |
| Place Batch Orders | `/fapi/v1/batchOrders` | POST | Yes | Collection of 1-5 orders, each with same fields as Place Order |
| Modify Order | `/fapi/v1/order` | PUT | Yes | Symbol, Order ID, Side (required by Binance for identification, not modifiable), Quantity, Price |
| Cancel Order | `/fapi/v1/order` | DELETE | Yes | Symbol, Order ID |
| Cancel All Orders | `/fapi/v1/allOpenOrders` | DELETE | Yes | Symbol |
| Get Order | `/fapi/v1/order` | GET | Yes | Symbol, Order ID |
| Get Open Orders | `/fapi/v1/openOrders` | GET | Yes | Symbol (optional) |
| Get All Orders | `/fapi/v1/allOrders` | GET | Yes | Symbol, Limit (default 50), Start Time, End Time |

**Conditional field visibility by Order Type:**

| Field | MARKET | LIMIT | STOP | STOP_MARKET | TAKE_PROFIT | TAKE_PROFIT_MARKET | TRAILING_STOP_MARKET |
|---|---|---|---|---|---|---|---|
| Price | - | show | show | - | show | - | - |
| Stop Price | - | - | show | show | show | show | - |
| Callback Rate | - | - | - | - | - | - | show (0.1-5%) |
| Time in Force | - | show (GTC/IOC/FOK/GTX) | show | - | show | - | - |
| Working Type | - | - | show | show | show | show | show |

**Additional UX notes:**
- All fields accept n8n expressions (e.g., `{{$json.symbol}}`)
- Client Order ID (optional): user-defined string for idempotent order placement and programmatic tracking
- `positionSide=BOTH` is hardcoded on all order placements (one-way mode)
- `newOrderRespType=RESULT` is hardcoded so the response includes filled price and quantity (not just ACK)
- Batch Orders uses n8n `fixedCollection` for visual order entry (no JSON). Each order in the batch supports all order types.
- Batch Orders response: Binance returns an array where each element is success or error. The node outputs one n8n item per order in the batch, each with its own success/error status, so downstream nodes can handle partial failures.

#### Resource: Position

| Operation | Endpoint | Method | Signed | Fields |
|---|---|---|---|---|
| Get Positions | `/fapi/v3/positionRisk` | GET | Yes | Symbol (optional) |
| Change Leverage | `/fapi/v1/leverage` | POST | Yes | Symbol, Leverage (1-125) |
| Change Margin Type | `/fapi/v1/marginType` | POST | Yes | Symbol, Margin Type (ISOLATED/CROSSED) |

#### Resource: Account

| Operation | Endpoint | Method | Signed | Fields |
|---|---|---|---|---|
| Get Account Info | `/fapi/v3/account` | GET | Yes | None |
| Get Balance | `/fapi/v3/balance` | GET | Yes | None |
| Get Income History | `/fapi/v1/income` | GET | Yes | Symbol (optional), Income Type (optional dropdown: REALIZED_PNL/FUNDING_FEE/COMMISSION/TRANSFER/INSURANCE_CLEAR/WELCOME_BONUS/INTERNAL_TRANSFER/DELIVERED_SETTLEMENT), Limit, Start Time, End Time |
| Get Trade History | `/fapi/v1/userTrades` | GET | Yes | Symbol, Order ID (optional — filter trades by specific order), Limit, Start Time, End Time |
| Get Leverage Brackets | `/fapi/v1/leverageBracket` | GET | Yes | Symbol (optional) |
| Get Commission Rate | `/fapi/v1/commissionRate` | GET | Yes | Symbol |

#### Resource: Wallet

These operations use the main Binance API (`https://api.binance.com/sapi/v1/...`) rather than the Futures API. The `binanceRequest` helper supports an optional `baseUrlOverride` parameter for these endpoints. Same API key/secret — just a different base URL.

| Operation | Endpoint | Method | Signed | Fields |
|---|---|---|---|---|
| Transfer | `/sapi/v1/asset/transfer` | POST | Yes | Type (dropdown: MAIN_UMFUTURE = Spot→Futures, UMFUTURE_MAIN = Futures→Spot), Asset (e.g., USDT), Amount |
| Withdraw | `/sapi/v1/capital/withdraw/apply` | POST | Yes | Coin (e.g., USDT), Address, Network (dropdown: e.g., ETH, BSC, TRC20), Amount, Address Tag (optional — for coins like XRP that require memo) |
| Get Transfer History | `/sapi/v1/asset/transfer` | GET | Yes | Type (same dropdown as Transfer), Start Time, End Time, Limit |

**Transfer Type values:**
- `MAIN_UMFUTURE`: Spot → USDS-M Futures
- `UMFUTURE_MAIN`: USDS-M Futures → Spot

#### Resource: Market Data

| Operation | Endpoint | Method | Signed | Fields |
|---|---|---|---|---|
| Get Klines | `/fapi/v1/klines` | GET | No | Symbol, Interval (1m-1M dropdown), Limit (default 50), Start Time, End Time |
| Get Mark Price | `/fapi/v1/premiumIndex` | GET | No | Symbol (optional). Returns mark price AND current funding rate/next funding time. |
| Get Funding Rate | `/fapi/v1/fundingRate` | GET | No | Symbol, Limit, Start Time, End Time. Returns funding rate history (vs Get Mark Price which returns current). |
| Get Ticker 24h | `/fapi/v1/ticker/24hr` | GET | No | Symbol (optional) |
| Get Order Book | `/fapi/v1/depth` | GET | No | Symbol, Limit (5/10/20/50/100) |
| Get Open Interest | `/fapi/v1/openInterest` | GET | No | Symbol |

**Date/time fields:** All Start Time and End Time fields use n8n's `dateTime` type, which provides a date picker UI. Values are converted to Unix milliseconds before sending to Binance.

### Dynamic Options (loadOptions)

- **getSymbols():** Calls `/fapi/v1/exchangeInfo`, returns all TRADING status symbols for dropdowns
- **getIntervals():** Static options array defined directly in properties (no loadOptions call needed — more performant since the list never changes): 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M

## Trigger Node: `BinanceFuturesTrigger`

### User Data Stream

**Lifecycle:**
1. Workflow activated → `POST /fapi/v1/listenKey` to get listen key
2. Opens WebSocket to `wss://<base>/ws/<listenKey>`
3. Every 30 minutes → `PUT /fapi/v1/listenKey` to renew (expires at 60 min)
4. Workflow deactivated → close WebSocket + `DELETE /fapi/v1/listenKey`

**Reconnection strategy:**
- On unexpected WebSocket disconnect: wait 1s, then reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- On reconnect: request new listen key if the old one expired
- On listen key renewal failure: close WebSocket, wait 5s, start fresh lifecycle
- Max reconnection attempts: 10, then stop and surface error in n8n

**UI Fields:**

| Field | Type | Notes |
|---|---|---|
| Event Type | Multi-select dropdown | Which events to listen for |

**Available Events:**

| Event | Payload | Use Case |
|---|---|---|
| Order Update | Order status changes (NEW, FILLED, PARTIALLY_FILLED, CANCELED, REJECTED, EXPIRED) | Confirm execution after TradingView signal |
| Account Update | Balance and position changes (trade, funding fee, deposit, withdraw) | Monitor available margin |
| Margin Call | Low margin alert | React before liquidation |
| Account Config Update | Leverage or margin type changes | Audit trail |

## File Structure

```
credentials/
  BinanceFuturesApi.credentials.ts

nodes/BinanceFutures/
  BinanceFutures.node.ts
  BinanceFuturesTrigger.node.ts
  BinanceFutures.svg

  helpers/
    binanceRequest.ts
    types.ts                               # Shared TypeScript interfaces for requests/responses

  methods/
    loadOptions.ts

  actions/
    order/
      placeOrder.execute.ts / placeOrder.properties.ts
      placeBatchOrders.execute.ts / placeBatchOrders.properties.ts
      modifyOrder.execute.ts / modifyOrder.properties.ts
      cancelOrder.execute.ts / cancelOrder.properties.ts
      cancelAllOrders.execute.ts / cancelAllOrders.properties.ts
      getOrder.execute.ts / getOrder.properties.ts
      getOpenOrders.execute.ts / getOpenOrders.properties.ts
      getAllOrders.execute.ts / getAllOrders.properties.ts
      index.ts

    position/
      getPositions.execute.ts / getPositions.properties.ts
      changeLeverage.execute.ts / changeLeverage.properties.ts
      changeMarginType.execute.ts / changeMarginType.properties.ts
      index.ts

    account/
      getAccountInfo.execute.ts / getAccountInfo.properties.ts
      getBalance.execute.ts / getBalance.properties.ts
      getIncomeHistory.execute.ts / getIncomeHistory.properties.ts
      getTradeHistory.execute.ts / getTradeHistory.properties.ts
      getLeverageBrackets.execute.ts / getLeverageBrackets.properties.ts
      getCommissionRate.execute.ts / getCommissionRate.properties.ts
      index.ts

    wallet/
      transfer.execute.ts / transfer.properties.ts
      withdraw.execute.ts / withdraw.properties.ts
      getTransferHistory.execute.ts / getTransferHistory.properties.ts
      index.ts

    marketData/
      getKlines.execute.ts / getKlines.properties.ts
      getMarkPrice.execute.ts / getMarkPrice.properties.ts
      getFundingRate.execute.ts / getFundingRate.properties.ts
      getTicker24h.execute.ts / getTicker24h.properties.ts
      getOrderBook.execute.ts / getOrderBook.properties.ts
      getOpenInterest.execute.ts / getOpenInterest.properties.ts
      index.ts

  triggers/
    userDataStream.trigger.ts
```

## Node Packaging

This is a **standalone node** — not the original `n8n-nodes-binance`. It will have its own npm package name (e.g., `n8n-nodes-binance-futures`). The `package.json` will only register the new nodes:

```json
{
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": ["dist/credentials/BinanceFuturesApi.credentials.js"],
    "nodes": [
      "dist/nodes/BinanceFutures/BinanceFutures.node.js",
      "dist/nodes/BinanceFutures/BinanceFuturesTrigger.node.js"
    ]
  }
}
```

Users install this alongside (or instead of) the original. No migration needed — different node names, different credentials.

## What Gets Removed

- `binance-api-node` dependency
- `technicalindicators` dependency
- All Spot trading actions
- Margin trading placeholder
- Custom function execution resource
- Candle WebSocket trigger (replaced by User Data Stream trigger)
- Original `nodes/Binance/` directory entirely

## What Gets Reused

- Modular pattern: `properties.ts` (UI definition) + `execute.ts` (API call) per operation
- `loadOptions.ts` pattern for dynamic dropdowns
- n8n node class structure (`INodeType`, `INodeTypeDescription`)
- Credential type structure (adapted for futures-specific fields)
- Build tooling (tsconfig, eslint, gulp)
