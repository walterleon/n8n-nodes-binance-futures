import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOrderBook(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const limit = ctx.getNodeParameter('limit', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/depth',
    signed: false,
    params: {
      symbol,
      limit,
    },
  });

  return ctx.helpers.returnJsonArray([response]);
}
