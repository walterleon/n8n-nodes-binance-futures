import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getTransferHistory(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  // Note: SAPI endpoints (wallet operations) are not available on testnet.
  const transferType = ctx.getNodeParameter('transferType', index) as string;
  const startTime = ctx.getNodeParameter('startTime', index, '') as string;
  const endTime = ctx.getNodeParameter('endTime', index, '') as string;
  const limit = ctx.getNodeParameter('limit', index) as number;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/sapi/v1/asset/transfer',
    signed: true,
    baseUrlType: 'sapi',
    params: {
      type: transferType,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
      size: limit,
    },
  });

  const rows = (response as IDataObject).rows as IDataObject[];
  return ctx.helpers.returnJsonArray(rows || []);
}
