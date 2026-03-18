import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getFundingRate(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const limit = ctx.getNodeParameter('limit', index) as number;
  const startTime = ctx.getNodeParameter('startTime', index, '') as string;
  const endTime = ctx.getNodeParameter('endTime', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/fundingRate',
    signed: false,
    params: {
      symbol,
      limit,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
    },
  });

  return ctx.helpers.returnJsonArray(response as IDataObject[]);
}
