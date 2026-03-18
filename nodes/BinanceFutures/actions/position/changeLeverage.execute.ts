import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function changeLeverage(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const leverage = ctx.getNodeParameter('leverage', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'POST',
    path: '/fapi/v1/leverage',
    signed: true,
    params: {
      symbol,
      leverage,
    },
  });

  return ctx.helpers.returnJsonArray([response as IDataObject]);
}
