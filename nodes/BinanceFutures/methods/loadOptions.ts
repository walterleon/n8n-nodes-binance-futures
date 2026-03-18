import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { binanceRequest } from '../helpers/binanceRequest';

export async function getSymbols(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const response = await binanceRequest.call(this, {
    method: 'GET',
    path: '/fapi/v1/exchangeInfo',
  });

  return response.symbols
    .filter((s: any) => s.status === 'TRADING')
    .map((s: any) => ({
      name: s.symbol,
      value: s.symbol,
    }));
}
