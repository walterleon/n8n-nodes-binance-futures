import { INodeProperties } from 'n8n-workflow';

export const getAllOrdersProperties: INodeProperties[] = [
	{
		displayName: 'Symbol Name or ID',
		name: 'symbol',
		type: 'options',
		required: true,
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
		displayOptions: { show: { resource: ['order'], operation: ['getAllOrders'] } },
		typeOptions: { loadOptionsMethod: 'getSymbols' },
		options: [],
		default: '',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['order'], operation: ['getAllOrders'] } },
		typeOptions: { minValue: 1, maxValue: 1000 },
		default: 50,
		description: 'Number of orders to return (max 1000)',
	},
	{
		displayName: 'Start Time',
		name: 'startTime',
		type: 'dateTime',
		displayOptions: { show: { resource: ['order'], operation: ['getAllOrders'] } },
		default: '',
		description: 'Start time for order history',
	},
	{
		displayName: 'End Time',
		name: 'endTime',
		type: 'dateTime',
		displayOptions: { show: { resource: ['order'], operation: ['getAllOrders'] } },
		default: '',
		description: 'End time for order history',
	},
];
