import { INodeProperties } from 'n8n-workflow';

export const cancelAlgoOrderProperties: INodeProperties[] = [
	{
		displayName: 'Algo Order ID',
		name: 'algoId',
		type: 'string',
		required: true,
		default: '',
		description: 'The algo order ID to cancel',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['cancelAlgoOrder'],
			},
		},
	},
];
