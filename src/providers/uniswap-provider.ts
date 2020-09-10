/**
 * UniSwap Smart Contract Provider
 */
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import IUniswapV2Factory from '@uniswap/v2-core/build/IUniswapV2Factory.json';
import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import debug from 'debug';

import { config } from '../config';
import { Dependency } from '../lib/classes';
import { IDependencies, IUniTradeOrder } from '../lib/types';

const Web3 = require('web3');

const log = debug('unitrade-service:providers:uniswap');

export class UniSwapProvider extends Dependency {
  private accountId: string;
  private pairs: { [pairAddress: string]: any };
  private web3: any;
  public factory: any;
  public router: any;
  public callOptions = {};
  public sendOptions = {};

  constructor(dependencies: IDependencies) {
    super(dependencies);

    this.web3 = new Web3(config.ropsten.uri);
    
    this.accountId = config.user.account;
    const { factoryAddress, routerAddress } = config.uniswap;
    this.factory = new this.web3.eth.Contract(IUniswapV2Factory.abi, factoryAddress);
    this.router = new this.web3.eth.Contract(IUniswapV2Router02.abi, routerAddress);

    this.callOptions = {
      from: this.accountId,
    };
    this.sendOptions = this.callOptions;
  }

  public async getPairAddress(tokenIn: string, tokenOut: string) {
    return await this.factory.methods.getOrCreatePair(tokenIn, tokenOut);
  }

  public getOrCreatePair(pairAddress: string) {
    if (!this.pairs[pairAddress]) {
      this.pairs[pairAddress] = new this.web3.eth.Contract(IUniswapV2Pair.abi, pairAddress);
    }
    return this.pairs[pairAddress];
  }

  public async shouldPlaceOrder(order: IUniTradeOrder): Promise<boolean | null> {
    try {
      const amounts = await this.router.methods.getAmountsOut(order.amountInOffered, [order.tokenIn, order.tokenOut]).call({
        from: this.accountId,
      });

      if (!amounts || !amounts.length) {
        return false;
      }
      
      const resultingTokens = amounts[amounts.length - 1];
      
      if (!resultingTokens) {
        return false;
      }
      
      if (resultingTokens === order.amountOutDesired) {
        return true;
      }

      return false;
    } catch (err) {
      log('[shouldPlaceOrder] Error: %O', err);
      return null;
    }
  }
}
