export { getKlines } from './getKlines.execute';
export { getMarkPrice } from './getMarkPrice.execute';
export { getFundingRate } from './getFundingRate.execute';
export { getTicker24h } from './getTicker24h.execute';
export { getOrderBook } from './getOrderBook.execute';
export { getOpenInterest } from './getOpenInterest.execute';

import { getKlinesProperties } from './getKlines.properties';
import { getMarkPriceProperties } from './getMarkPrice.properties';
import { getFundingRateProperties } from './getFundingRate.properties';
import { getTicker24hProperties } from './getTicker24h.properties';
import { getOrderBookProperties } from './getOrderBook.properties';
import { getOpenInterestProperties } from './getOpenInterest.properties';

export const marketDataProperties = [
  ...getKlinesProperties,
  ...getMarkPriceProperties,
  ...getFundingRateProperties,
  ...getTicker24hProperties,
  ...getOrderBookProperties,
  ...getOpenInterestProperties,
];
