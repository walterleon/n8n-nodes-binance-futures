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
    { name: 'Cancel Algo Order', value: 'cancelAlgoOrder', action: 'Cancel a conditional algo order' },
    { name: 'Get Algo Order', value: 'getAlgoOrder', action: 'Get a conditional algo order status' },
    { name: 'Get Open Algo Orders', value: 'getOpenAlgoOrders', action: 'Get all open conditional algo orders' },
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
