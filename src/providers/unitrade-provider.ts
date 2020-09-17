/**
 * UniTrade Smart Contract Provider
 */
import debug from 'debug';
import Web3 from 'web3';
import { AbiItem, toBN } from 'web3-utils';

import { config } from '../config';
import UniTrade from '../lib/abis/UniTrade.json';
import { Dependency } from '../lib/classes';
import { IUniTradeOrder } from '../lib/types';

const log = debug('unitrade-service:providers:unitrade');

export class UniTradeProvider extends Dependency {
  public contract: any;

  public init = (web3: Web3) => {
    this.setWeb3(web3);
    this.contract = new this.web3.eth.Contract(UniTrade.abi as AbiItem[], config.unitrade.address);
  }

  public listOrders = async () => {
    try {
      const activeOrdersLength = await this.contract.methods.getActiveOrdersLength().call();
      const orders: IUniTradeOrder[] = [];
      for (let i = 0; i < activeOrdersLength; i += 1) {
        const activeOrderId = await this.contract.methods.getActiveOrderId(i).call();
        const order = await this.contract.methods.getOrder(activeOrderId).call();
        orders.push({
          ...order,
          orderId: typeof activeOrderId === 'string' ? parseInt(activeOrderId) : activeOrderId,
        });
      }
      return orders;
    } catch (err) {
      log('Error getting active orders: %O', err);
    }
  };

  public executeOrder = async (order: IUniTradeOrder) => {
    try {
      return await this.contract.methods.executeOrder(order.orderId).send({
        from: this.dependencies.providers.account?.address(),
        gas: config.defaultGasLimit,
      });
    } catch (err) {
      log(err);
    }
  };
}
