import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getOpenInterest(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/openInterest',
    signed: false,
    params: {
      symbol,
    },
  });

  return ctx.helpers.returnJsonArray([response]);
}
