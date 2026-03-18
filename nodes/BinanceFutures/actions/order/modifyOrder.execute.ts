import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function modifyOrder(
	ctx: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const symbol = ctx.getNodeParameter('symbol', index) as string;
	const orderId = ctx.getNodeParameter('orderId', index) as number;
	const side = ctx.getNodeParameter('side', index) as string;
	const quantity = ctx.getNodeParameter('quantity', index) as number;
	const price = ctx.getNodeParameter('price', index) as number;

	const response = await binanceRequest.call(ctx, {
		method: 'PUT',
		path: '/fapi/v1/order',
		signed: true,
		params: {
			symbol,
			orderId,
			side,
			quantity: String(quantity),
			price: String(price),
		},
	});

	return ctx.helpers.returnJsonArray([response as IDataObject]);
}
