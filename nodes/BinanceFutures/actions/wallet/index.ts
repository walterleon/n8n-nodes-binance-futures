export { transfer } from './transfer.execute';
export { withdraw } from './withdraw.execute';
export { getTransferHistory } from './getTransferHistory.execute';

import { transferProperties } from './transfer.properties';
import { withdrawProperties } from './withdraw.properties';
import { getTransferHistoryProperties } from './getTransferHistory.properties';

export const walletProperties = [
  ...transferProperties,
  ...withdrawProperties,
  ...getTransferHistoryProperties,
];
