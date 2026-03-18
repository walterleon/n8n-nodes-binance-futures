import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

const ALGO_ORDER_TYPES = ['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET', 'TRAILING_STOP_MARKET'];

function toFixed6(value: number | string): string {
	return Number(value).toFixed(6);
}

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

	const isAlgoOrder = ALGO_ORDER_TYPES.includes(orderType);

	if (isAlgoOrder) {
		// Route conditional order types to Algo Order endpoint
		const algoParams: Record<string, string | number | boolean | undefined> = {
			algoType: 'CONDITIONAL',
			symbol,
			side,
			type: orderType,
			positionSide: 'BOTH',
			newOrderRespType: 'RESULT',
			quantity: toFixed6(quantity),
		};

		// Price — only for STOP, TAKE_PROFIT
		if (['STOP', 'TAKE_PROFIT'].includes(orderType)) {
			const price = ctx.getNodeParameter('price', index) as number;
			if (price) algoParams.price = toFixed6(price);
			const timeInForce = ctx.getNodeParameter('timeInForce', index) as string;
			if (timeInForce) algoParams.timeInForce = timeInForce;
		}

		// triggerPrice (was stopPrice) — for STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET
		if (['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET'].includes(orderType)) {
			const stopPrice = ctx.getNodeParameter('stopPrice', index) as number;
			if (stopPrice) algoParams.triggerPrice = toFixed6(stopPrice);
		}

		// callbackRate — only for TRAILING_STOP_MARKET
		if (orderType === 'TRAILING_STOP_MARKET') {
			const callbackRate = ctx.getNodeParameter('callbackRate', index) as number;
			if (callbackRate) algoParams.callbackRate = toFixed6(callbackRate);
		}

		// workingType — for all algo order types
		const workingType = ctx.getNodeParameter('workingType', index) as string;
		if (workingType) algoParams.workingType = workingType;

		// Reduce Only — only include if true
		if (reduceOnly) algoParams.reduceOnly = 'true';

		// Client Algo ID — uses clientAlgoId instead of newClientOrderId
		if (clientOrderId) algoParams.clientAlgoId = clientOrderId;

		const response = await binanceRequest.call(ctx, {
			method: 'POST',
			path: '/fapi/v1/algoOrder',
			signed: true,
			params: algoParams,
		});

		return ctx.helpers.returnJsonArray([response as IDataObject]);
	} else {
		// Regular order types (MARKET, LIMIT) — use standard order endpoint
		const params: Record<string, string | number | boolean | undefined> = {
			symbol,
			side,
			type: orderType,
			quantity: toFixed6(quantity),
			positionSide: 'BOTH',
			newOrderRespType: 'RESULT',
		};

		// Price — only for LIMIT
		if (orderType === 'LIMIT') {
			const price = ctx.getNodeParameter('price', index) as number;
			params.price = toFixed6(price);
		}

		// Time in Force — only for LIMIT
		if (orderType === 'LIMIT') {
			const timeInForce = ctx.getNodeParameter('timeInForce', index) as string;
			params.timeInForce = timeInForce;
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
}
