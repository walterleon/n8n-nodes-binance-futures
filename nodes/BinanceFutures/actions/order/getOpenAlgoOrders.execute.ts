import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOpenAlgoOrders(
	ctx: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const symbol = ctx.getNodeParameter('symbol', index, '') as string;

	const params: Record<string, string | number | boolean | undefined> = {};

	if (symbol) params.symbol = symbol;

	const response = await binanceRequest.call(ctx, {
		method: 'GET',
		path: '/fapi/v1/openAlgoOrders',
		signed: true,
		params,
	});

	if (Array.isArray(response)) {
		return ctx.helpers.returnJsonArray(response as IDataObject[]);
	}

	const orders = (response as any).orders || [response];
	return ctx.helpers.returnJsonArray(orders as IDataObject[]);
}
