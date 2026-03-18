import { INodeProperties } from 'n8n-workflow';

export const getOpenAlgoOrdersProperties: INodeProperties[] = [
	{
		displayName: 'Symbol Name or ID',
		name: 'symbol',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getSymbols',
		},
		default: '',
		required: false,
		description: 'Trading pair (leave empty for all). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['getOpenAlgoOrders'],
			},
		},
	},
];
