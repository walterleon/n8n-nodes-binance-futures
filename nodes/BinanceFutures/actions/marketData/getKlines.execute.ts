import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData } from 'n8n-workflow';
import { binanceRequest } from '../../helpers/binanceRequest';

export async function getKlines(
  ctx: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const symbol = ctx.getNodeParameter('symbol', index) as string;
  const interval = ctx.getNodeParameter('interval', index) as string;
  const limit = ctx.getNodeParameter('limit', index) as number;
  const startTime = ctx.getNodeParameter('startTime', index, '') as string;
  const endTime = ctx.getNodeParameter('endTime', index, '') as string;

  const response = await binanceRequest.call(ctx, {
    method: 'GET',
    path: '/fapi/v1/klines',
    signed: false,
    params: {
      symbol,
      interval,
      limit,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
    },
  });

  const klines = (response as any[][]).map((k: any[]) => ({
    openTime: Number(k[0]),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
    closeTime: Number(k[6]),
    quoteVolume: Number(k[7]),
    trades: Number(k[8]),
    takerBuyBaseVolume: Number(k[9]),
    takerBuyQuoteVolume: Number(k[10]),
  }));

  return ctx.helpers.returnJsonArray(klines);
}
