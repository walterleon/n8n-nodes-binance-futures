import { INodeProperties } from 'n8n-workflow';

export const getOpenOrdersProperties: INodeProperties[] = [
	{
		displayName: 'Symbol Name or ID',
		name: 'symbol',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Leave empty to get open orders for all symbols.',
		displayOptions: { show: { resource: ['order'], operation: ['getOpenOrders'] } },
		typeOptions: { loadOptionsMethod: 'getSymbols' },
		options: [],
		default: '',
	},
];
