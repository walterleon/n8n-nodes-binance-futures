import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

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

	const batchOrders = orders.map((o) => {
		const order: Record<string, string | boolean> = {
			symbol: o.symbol,
			side: o.side,
			type: o.type,
			quantity: String(o.quantity),
			positionSide: 'BOTH',
			newOrderRespType: 'RESULT',
		};

		// Price — only for LIMIT, STOP, TAKE_PROFIT
		if (['LIMIT', 'STOP', 'TAKE_PROFIT'].includes(o.type) && o.price) {
			order.price = String(o.price);
		}

		// Stop Price — only for STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET
		if (['STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET'].includes(o.type) && o.stopPrice) {
			order.stopPrice = String(o.stopPrice);
		}

		// Time in Force — only for LIMIT, STOP, TAKE_PROFIT
		if (['LIMIT', 'STOP', 'TAKE_PROFIT'].includes(o.type)) {
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

	const results = Array.isArray(response) ? response : [response];
	return results.map((r: any) => ({ json: r }));
}
