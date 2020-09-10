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
  private accountId: string;
  private web3: any;
  public contract: any;
  public callOptions = {};
  public sendOptions = {};

  constructor(dependencies: IDependencies) {
    super(dependencies);

    this.web3 = new Web3(config.ropsten.uri);

    const { user, unitrade } = config;
    this.accountId = user.account;
    this.contract = new this.web3.eth.Contract(UniTrade.abi, unitrade.address);

    this.callOptions = {
      from: this.accountId,
    };
    this.sendOptions = this.callOptions;
  }

  public listOrders = async () => {
    try {
      return await this.contract.methods.listActiveOrders().call({
        from: this.accountId,
      });
    } catch (err) {
      log('Error getting active orders: %O', err);
      throw err;
    }
  };

  public executeOrder = async (orderId: string) => {
    try {
      return await this.contract.methods.executeOrder(orderId).send({
        from: this.accountId,
      });
    } catch (err) {
      log('Error placing order: %O', err);
      throw err;
    }
  };
}
