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
