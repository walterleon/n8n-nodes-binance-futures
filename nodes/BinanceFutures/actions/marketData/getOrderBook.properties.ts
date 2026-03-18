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
    description: 'Number of order book entries to return',
  },
];
