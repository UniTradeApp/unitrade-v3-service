import { UniTradeProvider, UniSwapProvider } from '../providers';

/**
 * Dependencies
 */
export class IDependencies {
  providers: {
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
  orderId: string;

  // addresses
  maker: string;
  tokenIn: string;
  tokenOut: string;

  amountInOffered: number;
  amountOutDesired: number;
  incentiveFee: number;
  activeOrderIndex: number;
}
