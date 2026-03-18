export { getPositions } from './getPositions.execute';
export { changeLeverage } from './changeLeverage.execute';
export { changeMarginType } from './changeMarginType.execute';

import { getPositionsProperties } from './getPositions.properties';
import { changeLeverageProperties } from './changeLeverage.properties';
import { changeMarginTypeProperties } from './changeMarginType.properties';

export const positionProperties = [
  ...getPositionsProperties,
  ...changeLeverageProperties,
  ...changeMarginTypeProperties,
];
