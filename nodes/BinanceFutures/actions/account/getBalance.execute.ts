import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getBalance(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v3/balance',
    signed: true,
    params: {},
  });

  return ctx.helpers.returnJsonArray(response as IDataObject[]);
}
