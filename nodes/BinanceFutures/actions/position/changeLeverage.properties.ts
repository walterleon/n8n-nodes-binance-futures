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
    description: 'Target initial leverage (1 to 125)',
  },
];
