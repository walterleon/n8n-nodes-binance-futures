import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getIncomeHistory(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index, '') as string;
  const incomeType = ctx.getNodeParameter('incomeType', index, '') as string;
  const limit = ctx.getNodeParameter('limit', index) as number;
  const startTime = ctx.getNodeParameter('startTime', index, '') as string;
  const endTime = ctx.getNodeParameter('endTime', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/income',
    signed: true,
    params: {
      symbol: symbol || undefined,
      incomeType: incomeType || undefined,
      limit,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
    },
  });

  return ctx.helpers.returnJsonArray(response as IDataObject[]);
}
