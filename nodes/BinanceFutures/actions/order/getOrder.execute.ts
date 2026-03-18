import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOrder(
	ctx: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const symbol = ctx.getNodeParameter('symbol', index) as string;
	const orderId = ctx.getNodeParameter('orderId', index) as number;

	const response = await binanceRequest.call(ctx, {
		method: 'GET',
		path: '/fapi/v1/order',
		signed: true,
		params: {
			symbol,
			orderId,
		},
	});

	return ctx.helpers.returnJsonArray([response as IDataObject]);
}
