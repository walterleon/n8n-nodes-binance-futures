import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function changeMarginType(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const marginType = ctx.getNodeParameter('marginType', index) as string;

  try {
    const response = await binanceRequest.call(ctx, {
      method: 'POST',
      path: '/fapi/v1/marginType',
      signed: true,
      params: {
        symbol,
        marginType,
      },
    });

    return ctx.helpers.returnJsonArray([response as IDataObject]);
  } catch (error: any) {
    if (error.message?.includes('-4046')) {
      return ctx.helpers.returnJsonArray([{
        success: true,
        message: `Margin type already set to ${marginType}`,
      }]);
    }
    throw error;
  }
}
