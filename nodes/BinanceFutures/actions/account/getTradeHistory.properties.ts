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
    description: 'Number of trade records to return (max 1000)',
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['account'], operation: ['getTradeHistory'] } },
    default: '',
    description: 'Start time for trade history',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['account'], operation: ['getTradeHistory'] } },
    default: '',
    description: 'End time for trade history',
  },
];
