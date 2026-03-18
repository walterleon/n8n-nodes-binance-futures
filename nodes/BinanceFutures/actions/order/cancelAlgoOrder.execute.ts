import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function cancelAlgoOrder(
	ctx: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const algoId = ctx.getNodeParameter('algoId', index) as string;

	const params: Record<string, string | number | boolean | undefined> = {};

	if (algoId) params.algoId = algoId;

	const response = await binanceRequest.call(ctx, {
		method: 'DELETE',
		path: '/fapi/v1/algoOrder',
		signed: true,
		params,
	});

	return ctx.helpers.returnJsonArray([response as IDataObject]);
}
