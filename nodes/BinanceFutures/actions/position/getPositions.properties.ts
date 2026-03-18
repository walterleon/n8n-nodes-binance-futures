import { INodeProperties } from 'n8n-workflow';

export const getPositionsProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty to get positions for all symbols.',
    displayOptions: { show: { resource: ['position'], operation: ['getPositions'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
];
