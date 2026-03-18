import { INodeProperties } from 'n8n-workflow';

export const getAlgoOrderProperties: INodeProperties[] = [
	{
		displayName: 'Algo Order ID',
		name: 'algoId',
		type: 'string',
		required: true,
		default: '',
		description: 'The algo order ID to query',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['getAlgoOrder'],
			},
		},
	},
];
