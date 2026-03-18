import { INodeProperties } from 'n8n-workflow';

export const transferProperties: INodeProperties[] = [
  {
    displayName: 'Transfer Type',
    name: 'transferType',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['transfer'] } },
    options: [
      { name: 'Spot → Futures', value: 'MAIN_UMFUTURE' },
      { name: 'Futures → Spot', value: 'UMFUTURE_MAIN' },
    ],
    default: 'MAIN_UMFUTURE',
    description: 'Direction of transfer',
  },
  {
    displayName: 'Asset',
    name: 'asset',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['transfer'] } },
    default: 'USDT',
    description: 'Asset to transfer (e.g., USDT, BUSD)',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['transfer'] } },
    typeOptions: { numberPrecision: 8 },
    default: 0,
    description: 'Amount to transfer',
  },
];
