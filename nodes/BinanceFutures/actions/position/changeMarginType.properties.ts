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
    description: 'Margin type for the symbol',
  },
];
