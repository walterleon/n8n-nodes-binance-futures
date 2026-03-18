import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class BinanceFuturesApi implements ICredentialType {
  name = 'binanceFuturesApi';
  displayName = 'Binance Futures API';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        { name: 'Production', value: 'production' },
        { name: 'Testnet', value: 'testnet' },
      ],
      default: 'production',
    },
  ];
}
