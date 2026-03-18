import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getMarkPrice(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/premiumIndex',
    signed: false,
    params: {
      symbol: symbol || undefined,
    },
  });

  const normalized = Array.isArray(response) ? response : [response];

  return ctx.helpers.returnJsonArray(normalized);
}
