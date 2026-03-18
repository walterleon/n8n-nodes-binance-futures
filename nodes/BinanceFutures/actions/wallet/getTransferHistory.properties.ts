import { INodeProperties } from 'n8n-workflow';

export const getTransferHistoryProperties: INodeProperties[] = [
  {
    displayName: 'Transfer Type',
    name: 'transferType',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['wallet'], operation: ['getTransferHistory'] } },
    options: [
      { name: 'Spot → Futures', value: 'MAIN_UMFUTURE' },
      { name: 'Futures → Spot', value: 'UMFUTURE_MAIN' },
    ],
    default: 'MAIN_UMFUTURE',
    description: 'Direction of transfer to query',
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['wallet'], operation: ['getTransferHistory'] } },
    default: '',
    description: 'Start time for transfer history',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['wallet'], operation: ['getTransferHistory'] } },
    default: '',
    description: 'End time for transfer history',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['wallet'], operation: ['getTransferHistory'] } },
    typeOptions: { minValue: 1, maxValue: 100 },
    default: 10,
    description: 'Number of transfer records to return (max 100)',
  },
];
