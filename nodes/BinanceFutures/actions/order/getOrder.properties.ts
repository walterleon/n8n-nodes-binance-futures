import { INodeProperties } from 'n8n-workflow';

export const getOrderProperties: INodeProperties[] = [
	{
		displayName: 'Symbol Name or ID',
		name: 'symbol',
		type: 'options',
		required: true,
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: { show: { resource: ['order'], operation: ['getOrder'] } },
		typeOptions: { loadOptionsMethod: 'getSymbols' },
		options: [],
		default: '',
	},
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['order'], operation: ['getOrder'] } },
		default: 0,
		description: 'The order ID to query',
	},
];
