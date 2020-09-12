import { UniTradeProvider, UniSwapProvider, AccountProvider } from '../providers';

/**
 * Dependencies
 */
export class IDependencies {
  providers: {
    account?: AccountProvider;
    uniTrade?: UniTradeProvider;
    uniSwap?: UniSwapProvider;
  };
}

/**
 * Orders
 */
export interface IUniSwapOrder {
  transactionHash: string;
  transactionIndex: number,
  blockHash: string;
  blockNumber: number,
  from: string;
  to: string;
  gasUsed: number;
  cumulativeGasUsed: number;
  contractAddress: string | null;
  status: boolean;
  logsBloom: string;
  events: any;
}

export interface IUniTradeOrder {
  orderId: number;

  // addresses
  maker: string;
  tokenIn: string;
  tokenOut: string;

  amountInOffered: number;
  amountOutExpected: number;
  executorFee: number;
  activeOrderIndex: number;
}
