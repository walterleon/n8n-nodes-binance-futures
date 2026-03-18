export { placeOrder } from './placeOrder.execute';
export { placeBatchOrders } from './placeBatchOrders.execute';
export { modifyOrder } from './modifyOrder.execute';
export { cancelOrder } from './cancelOrder.execute';
export { cancelAllOrders } from './cancelAllOrders.execute';
export { getOrder } from './getOrder.execute';
export { getOpenOrders } from './getOpenOrders.execute';
export { getAllOrders } from './getAllOrders.execute';

import { placeOrderProperties } from './placeOrder.properties';
import { placeBatchOrdersProperties } from './placeBatchOrders.properties';
import { modifyOrderProperties } from './modifyOrder.properties';
import { cancelOrderProperties } from './cancelOrder.properties';
import { cancelAllOrdersProperties } from './cancelAllOrders.properties';
import { getOrderProperties } from './getOrder.properties';
import { getOpenOrdersProperties } from './getOpenOrders.properties';
import { getAllOrdersProperties } from './getAllOrders.properties';

export const orderProperties = [
	...placeOrderProperties,
	...placeBatchOrdersProperties,
	...modifyOrderProperties,
	...cancelOrderProperties,
	...cancelAllOrdersProperties,
	...getOrderProperties,
	...getOpenOrdersProperties,
	...getAllOrdersProperties,
];
