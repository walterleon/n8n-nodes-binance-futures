import { INodeProperties } from 'n8n-workflow';
import { INTERVALS } from '../../helpers/types';

export const getKlinesProperties: INodeProperties[] = [
  {
    displayName: 'Symbol Name or ID',
    name: 'symbol',
    type: 'options',
    required: true,
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    typeOptions: { loadOptionsMethod: 'getSymbols' },
    options: [],
    default: '',
  },
  {
    displayName: 'Interval',
    name: 'interval',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    options: INTERVALS as Array<{ name: string; value: string }>,
    default: '1h',
    description: 'Kline/candlestick interval',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    typeOptions: { minValue: 1, maxValue: 1500 },
    default: 50,
    description: 'Number of klines to return (max 1500)',
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    default: '',
    description: 'Start time for klines',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: { show: { resource: ['marketData'], operation: ['getKlines'] } },
    default: '',
    description: 'End time for klines',
  },
];
