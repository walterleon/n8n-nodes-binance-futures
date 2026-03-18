import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function cancelAllOrders(
	ctx: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const symbol = ctx.getNodeParameter('symbol', index) as string;

	const response = await binanceRequest.call(ctx, {
		method: 'DELETE',
		path: '/fapi/v1/allOpenOrders',
		signed: true,
		params: {
			symbol,
		},
	});

	return ctx.helpers.returnJsonArray([response as IDataObject]);
}
