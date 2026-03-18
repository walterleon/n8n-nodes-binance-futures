import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOpenOrders(
	ctx: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const symbol = ctx.getNodeParameter('symbol', index, '') as string;

	const response = await binanceRequest.call(ctx, {
		method: 'GET',
		path: '/fapi/v1/openOrders',
		signed: true,
		params: {
			symbol: symbol || undefined,
		},
	});

	return ctx.helpers.returnJsonArray(response as IDataObject[]);
}
