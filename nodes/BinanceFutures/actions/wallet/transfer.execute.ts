import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function transfer(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  // Note: SAPI endpoints (wallet operations) are not available on testnet.
  const transferType = ctx.getNodeParameter('transferType', index) as string;
  const asset = ctx.getNodeParameter('asset', index) as string;
  const amount = ctx.getNodeParameter('amount', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'POST',
    path: '/sapi/v1/asset/transfer',
    signed: true,
    baseUrlType: 'sapi',
    params: {
      type: transferType,
      asset,
      amount: String(amount),
    },
  });

  return ctx.helpers.returnJsonArray([response as IDataObject]);
}
