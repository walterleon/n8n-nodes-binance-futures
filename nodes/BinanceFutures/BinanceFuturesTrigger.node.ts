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
