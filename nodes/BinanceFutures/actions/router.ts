import { INodeExecutionData } from 'n8n-workflow';
import { IExecuteFunctions } from 'n8n-core';

import * as order from './order';
import * as position from './position';
import * as account from './account';
import * as wallet from './wallet';
import * as marketData from './marketData';

const resourceExecutors: Record<
  string,
  Record<string, (ctx: IExecuteFunctions, index: number) => Promise<INodeExecutionData[]>>
> = {
  order: order as any,
  position: position as any,
  account: account as any,
  wallet,
  marketData: marketData as any,
};

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let index = 0; index < items.length; index++) {
    const resource = this.getNodeParameter('resource', index) as string;
    const operation = this.getNodeParameter('operation', index) as string;

    try {
      const executor = resourceExecutors[resource]?.[operation];
      if (!executor) {
        throw new Error(`Unknown resource/operation: ${resource}/${operation}`);
      }

      const data = await executor(this, index);
      const dataWithMeta = data.map((value) => ({
        ...value,
        pairedItem: { item: index },
      }));

      returnData.push(...dataWithMeta);
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message }, pairedItem: { item: index } });
      } else {
        if (error.context) error.context.itemIndex = index;
        throw error;
      }
    }
  }

  return [returnData];
}
