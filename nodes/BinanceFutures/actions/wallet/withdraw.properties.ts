import { INodeProperties } from 'n8n-workflow';

export const withdrawProperties: INodeProperties[] = [
  {
    displayName: 'Coin',
    name: 'coin',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    default: 'USDT',
    description: 'Coin to withdraw',
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    default: '',
    description: 'Withdrawal destination address',
  },
  {
    displayName: 'Network',
    name: 'network',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    default: '',
    description: 'Network to use (e.g., ETH, BSC, TRX, SOL)',
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'number',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    typeOptions: { numberPrecision: 8 },
    default: 0,
    description: 'Amount to withdraw',
  },
  {
    displayName: 'Address Tag',
    name: 'addressTag',
    type: 'string',
    displayOptions: { show: { resource: ['wallet'], operation: ['withdraw'] } },
    default: '',
    description: 'Memo/tag for coins that require it (e.g., XRP, XLM)',
  },
];
