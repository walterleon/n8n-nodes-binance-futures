import { INodeProperties } from 'n8n-workflow';

export const getTicker24hProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty to get ticker for all symbols.',
    displayOptions: { show: { resource: ['marketData'], operation: ['getTicker24h'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
