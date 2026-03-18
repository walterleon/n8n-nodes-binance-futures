import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function withdraw(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  // Note: SAPI endpoints (wallet operations) are not available on testnet.
  const coin = ctx.getNodeParameter('coin', index) as string;
  const address = ctx.getNodeParameter('address', index) as string;
  const network = ctx.getNodeParameter('network', index) as string;
  const amount = ctx.getNodeParameter('amount', index) as number;
  const addressTag = ctx.getNodeParameter('addressTag', index, '') as string;

  const params: Record<string, string | number | boolean | undefined> = {
    coin,
    address,
    network,
    amount: String(amount),
  };

  if (addressTag) {
    params.addressTag = addressTag;
  }

  const response = await binanceRequest.call(ctx, {
    method: 'POST',
    path: '/sapi/v1/capital/withdraw/apply',
    signed: true,
    baseUrlType: 'sapi',
    params,
  });

  return ctx.helpers.returnJsonArray([response as IDataObject]);
}
