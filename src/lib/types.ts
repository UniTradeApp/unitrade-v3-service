import { UniTradeProvider, UniSwapProvider, AccountProvider, EthGasStationProvider } from "../providers";

/**
 * Dependencies
 */
export class IDependencies {
  providers: {
    account?: AccountProvider;
    uniTrade?: UniTradeProvider;
    uniSwap?: UniSwapProvider;
    ethGasStation?: EthGasStationProvider;
  };
}

/**
 * Orders
 */
export interface IUniSwapOrder {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string;
  gasUsed: number;
  cumulativeGasUsed: number;
  contractAddress: string | null;
  status: boolean;
  logsBloom: string;
  events: any;
}

export enum OrderType {
  LIMIT = 0,
  STOP = 1,
}

export interface IUniTradeOrder {
  orderId: number;
  orderType: OrderType;

  // addresses
  maker: string;
  tokenIn: string;
  tokenOut: string;

  amountInOffered: number;
  amountOutExpected: number;
  executorFee: number;
  activeOrderIndex: number;
}
