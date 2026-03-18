import { INodeProperties } from 'n8n-workflow';

export const cancelAllOrdersProperties: INodeProperties[] = [
	{
		displayName: 'Symbol Name or ID',
		name: 'symbol',
		type: 'options',
		required: true,
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: { show: { resource: ['order'], operation: ['cancelAllOrders'] } },
		typeOptions: { loadOptionsMethod: 'getSymbols' },
		options: [],
		default: '',
	},
];
