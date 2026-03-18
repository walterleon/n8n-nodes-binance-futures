import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function placeOrder(
	ctx: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const symbol = ctx.getNodeParameter('symbol', index) as string;
	const side = ctx.getNodeParameter('side', index) as string;
	const orderType = ctx.getNodeParameter('orderType', index) as string;
	const quantity = ctx.getNodeParameter('quantity', index) as number;
	const reduceOnly = ctx.getNodeParameter('reduceOnly', index) as boolean;
	const clientOrderId = ctx.getNodeParameter('clientOrderId', index, '') as string;

	const params: Record<string, string | number | boolean | undefined> = {
		symbol,
		side,
		type: orderType,
		quantity: String(quantity),
		positionSide: 'BOTH',
		newOrderRespType: 'RESULT',
	};

	// Price — only for LIMIT, STOP, TAKE_PROFIT
	if (['LIMIT', 'STOP', 'TAKE_PROFIT'].includes(orderType)) {
		const price = ctx.getNodeParameter('price', index) as number;
		params.price = String(price);
	}

	// Stop Price — only for STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET
	if (['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET'].includes(orderType)) {
		const stopPrice = ctx.getNodeParameter('stopPrice', index) as number;
		params.stopPrice = String(stopPrice);
	}

	// Callback Rate — only for TRAILING_STOP_MARKET
	if (orderType === 'TRAILING_STOP_MARKET') {
		const callbackRate = ctx.getNodeParameter('callbackRate', index) as number;
		params.callbackRate = String(callbackRate);
	}

	// Time in Force — only for LIMIT, STOP, TAKE_PROFIT
	if (['LIMIT', 'STOP', 'TAKE_PROFIT'].includes(orderType)) {
		const timeInForce = ctx.getNodeParameter('timeInForce', index) as string;
		params.timeInForce = timeInForce;
	}

	// Working Type — only for STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET, TRAILING_STOP_MARKET
	if (['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET', 'TRAILING_STOP_MARKET'].includes(orderType)) {
		const workingType = ctx.getNodeParameter('workingType', index) as string;
		params.workingType = workingType;
	}

	// Reduce Only — only include if true
	if (reduceOnly) {
		params.reduceOnly = 'true';
	}

	// Client Order ID — only include if non-empty
	if (clientOrderId) {
		params.newClientOrderId = clientOrderId;
	}

	const response = await binanceRequest.call(ctx, {
		method: 'POST',
		path: '/fapi/v1/order',
		signed: true,
		params,
	});

	return ctx.helpers.returnJsonArray([response as IDataObject]);
}
