export { getAccountInfo } from './getAccountInfo.execute';
export { getBalance } from './getBalance.execute';
export { getIncomeHistory } from './getIncomeHistory.execute';
export { getTradeHistory } from './getTradeHistory.execute';
export { getLeverageBrackets } from './getLeverageBrackets.execute';
export { getCommissionRate } from './getCommissionRate.execute';

import { getAccountInfoProperties } from './getAccountInfo.properties';
import { getBalanceProperties } from './getBalance.properties';
import { getIncomeHistoryProperties } from './getIncomeHistory.properties';
import { getTradeHistoryProperties } from './getTradeHistory.properties';
import { getLeverageBracketsProperties } from './getLeverageBrackets.properties';
import { getCommissionRateProperties } from './getCommissionRate.properties';

export const accountProperties = [
  ...getAccountInfoProperties,
  ...getBalanceProperties,
  ...getIncomeHistoryProperties,
  ...getTradeHistoryProperties,
  ...getLeverageBracketsProperties,
  ...getCommissionRateProperties,
];
