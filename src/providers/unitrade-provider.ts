/**
 * UniTrade Smart Contract Provider
 */
import debug from 'debug';

import { config } from '../config';
import UniTrade from '../lib/abis/UniTrade.json';
import { Dependency } from '../lib/classes';
import { IDependencies } from '../lib/types';

const Web3 = require('web3');

const log = debug('unitrade-service:providers:unitrade');

export class UniTradeProvider extends Dependency {
  private web3: any;
  public contract: any;

  constructor(dependencies: IDependencies) {
    super(dependencies);
    this.init();
  }
  
  private init() {
    this.web3 = new Web3(config.ropsten.uri);
  
    this.contract = new this.web3.eth.Contract(UniTrade.abi, config.unitrade.address);
  };

  public async listOrders(accountId: string) {
    try {
      return await this.contract.methods.listActiveOrders();
    } catch (err) {
      log('Error getting active orders: %O', err);
      throw err;
    }
  };

  public async executeOrder(accountId: string, orderId: string) {
    try {
      return await this.contract.methods.executeOrder(orderId).send({
        from: accountId,
      });
    } catch (err) {
      log('Error placing order: %O', err);
      throw err;
    }
  };
}
