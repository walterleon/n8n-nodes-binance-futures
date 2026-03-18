import { INodeProperties } from 'n8n-workflow';

export const getFundingRateProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['marketData'], operation: ['getFundingRate'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['marketData'], operation: ['getFundingRate'] } },
    typeOptions: { minValue: 1, maxValue: 1000 },
    default: 100,
    description: 'Number of funding rate records to return (max 1000)',
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['marketData'], operation: ['getFundingRate'] } },
    default: '',
    description: 'Start time for funding rate history',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['marketData'], operation: ['getFundingRate'] } },
    default: '',
    description: 'End time for funding rate history',
  },
];
