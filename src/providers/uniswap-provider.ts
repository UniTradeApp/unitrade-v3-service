/**
 * UniSwap Smart Contract Provider
 */
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import IUniswapV2Factory from '@uniswap/v2-core/build/IUniswapV2Factory.json';
import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import debug from 'debug';
import Web3 from 'web3';
import { AbiItem, toBN } from 'web3-utils';

import { config } from '../config';
import { Dependency } from '../lib/classes';
import { IUniTradeOrder } from '../lib/types';

const log = debug('unitrade-service:providers:uniswap');

export class UniSwapProvider extends Dependency {
  private pairs: { [pairAddress: string]: any } = {};
  public factory: any;
  public router: any;

  public init = (web3: Web3) => {
    this.setWeb3(web3);
    const { factoryAddress, routerAddress } = config.uniswap;
    this.factory = new this.web3.eth.Contract(IUniswapV2Factory.abi as AbiItem[], factoryAddress);
    this.router = new this.web3.eth.Contract(IUniswapV2Router02.abi as AbiItem[], routerAddress);
  }

  public getPairAddress = async (tokenIn: string, tokenOut: string) => {
    try {
      return await this.factory.methods.getPair(tokenIn, tokenOut).call({
        from: this.dependencies.providers.account?.address(),
      });
    } catch (err) {
      return;
    }
  }

  public getOrCreatePairContract = (pairAddress: string) => {
    if (!this.pairs[pairAddress]) {
      this.pairs[pairAddress] = new this.web3.eth.Contract(IUniswapV2Pair.abi as AbiItem[], pairAddress);
    }
    return this.pairs[pairAddress];
  }

  public shouldPlaceOrder = async (order: IUniTradeOrder): Promise<boolean> => {
    try {
      let placeOrder = false;

      const amounts = await this.router.methods.getAmountsOut(order.amountInOffered, [order.tokenIn, order.tokenOut]).call({
        from: this.dependencies.providers.account?.address(),
      });

      if (amounts && amounts.length) {
        const resultingTokens = amounts[amounts.length - 1];
        if (resultingTokens && toBN(resultingTokens).gte(toBN(order.amountOutExpected))) {
          placeOrder = true;
        }
      }

      const estimatedGas = await this.dependencies.providers.uniTrade?.contract.methods.executeOrder(order.orderId).estimateGas({
        from: this.dependencies.providers.account?.address(),
      });

      placeOrder = (estimatedGas <= order.executorFee);
      
      return placeOrder;
    } catch (err) {
      log('[shouldPlaceOrder] Should not place due to: %O', err.message);
      return false;
    }
  }
}
