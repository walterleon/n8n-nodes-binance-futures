import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

const ALGO_ORDER_TYPES = ['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET', 'TRAILING_STOP_MARKET'];

function toFixed6(value: number | string): string {
	return Number(value).toFixed(6);
}

export async function placeBatchOrders(
	ctx: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const ordersData = ctx.getNodeParameter('orders', index) as {
		order?: Array<{
			symbol: string;
			side: string;
			type: string;
			quantity: number;
			price: number;
			stopPrice: number;
			timeInForce: string;
			reduceOnly: boolean;
		}>;
	};

	const orders = ordersData.order || [];

	// Split into regular and algo orders
	const regularOrders = orders.filter((o) => !ALGO_ORDER_TYPES.includes(o.type));
	const algoOrders = orders.filter((o) => ALGO_ORDER_TYPES.includes(o.type));

	const results: any[] = [];

	// Process regular orders via batch endpoint
	if (regularOrders.length > 0) {
		const batchOrders = regularOrders.map((o) => {
			const order: Record<string, string | boolean> = {
				symbol: o.symbol,
				side: o.side,
				type: o.type,
				quantity: toFixed6(o.quantity),
				positionSide: 'BOTH',
				newOrderRespType: 'RESULT',
			};

			// Price — only for LIMIT
			if (o.type === 'LIMIT' && o.price) {
				order.price = toFixed6(o.price);
			}

			// Time in Force — only for LIMIT
			if (o.type === 'LIMIT') {
				order.timeInForce = o.timeInForce;
			}

			// Reduce Only — only include if true
			if (o.reduceOnly) {
				order.reduceOnly = 'true';
			}

			return order;
		});

		const response = await binanceRequest.call(ctx, {
			method: 'POST',
			path: '/fapi/v1/batchOrders',
			signed: true,
			params: {
				batchOrders: JSON.stringify(batchOrders),
			},
		});

		const batchResults = Array.isArray(response) ? response : [response];
		results.push(...batchResults);
	}

	// Process algo orders individually via algo order endpoint
	for (const o of algoOrders) {
		const algoParams: Record<string, string | number | boolean | undefined> = {
			algoType: 'CONDITIONAL',
			symbol: o.symbol,
			side: o.side,
			type: o.type,
			positionSide: 'BOTH',
			newOrderRespType: 'RESULT',
			quantity: toFixed6(o.quantity),
		};

		// Price — only for STOP, TAKE_PROFIT
		if (['STOP', 'TAKE_PROFIT'].includes(o.type) && o.price) {
			algoParams.price = toFixed6(o.price);
		}

		// Time in Force — only for STOP, TAKE_PROFIT
		if (['STOP', 'TAKE_PROFIT'].includes(o.type)) {
			algoParams.timeInForce = o.timeInForce;
		}

		// triggerPrice (was stopPrice) — for STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET
		if (['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET'].includes(o.type) && o.stopPrice) {
			algoParams.triggerPrice = toFixed6(o.stopPrice);
		}

		// Reduce Only — only include if true
		if (o.reduceOnly) {
			algoParams.reduceOnly = 'true';
		}

		const response = await binanceRequest.call(ctx, {
			method: 'POST',
			path: '/fapi/v1/algoOrder',
			signed: true,
			params: algoParams,
		});

		results.push(response);
	}

	return results.map((r: any) => ({ json: r }));
}
