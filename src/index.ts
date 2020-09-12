/**
 * UniTrade Order Execution Service
 * 
 * "The Executor"
 */
import debug from 'debug';
import { EventEmitter } from 'events';
import Web3 from 'web3';

import { config } from './config';
import { loader } from './utils/loader';
import { TokenPool } from './lib/classes';
import { IDependencies, IUniTradeOrder } from './lib/types';

const log = debug('unitrade-service');

export class UniTradeExecutorService {
  private dependencies: IDependencies;
  private activeOrders: IUniTradeOrder[];
  private pools: { [pairAddress: string]: TokenPool } = {};
  private poolListeners: { [pairAddress: string]: EventEmitter } = {};
  private orderListeners: { [eventName: string]: EventEmitter } = {};

  /**
   * Gracefully handle app shutdown
   * @param exitCode 
   */
  private handleShutdown(exitCode = 0) {
    try {
      log('Shutting down...');
    
      const poolsKeys = Object.keys(this.poolListeners);
      if (poolsKeys.length) {
        for (let p = 0; p < poolsKeys.length; p += 1) {
          const pairAddress = poolsKeys[p];
          this.poolListeners[pairAddress].removeAllListeners();
          delete this.poolListeners[pairAddress];
        }
      }
  
      const ordersKeys = Object.keys(this.orderListeners);
      if (ordersKeys.length) {
        for (let p = 0; p < ordersKeys.length; p += 1) {
          const pairAddress = ordersKeys[p];
          this.orderListeners[pairAddress].removeAllListeners();
          delete this.orderListeners[pairAddress];
        }
      }
  
      process.exit(exitCode);
    } catch (err) {
      log('Error during shutdown: %O', err);
      process.exit(1);
    }
  }

  constructor() {
    this.start();
    process.on('SIGINT', () => { this.handleShutdown(); });
    process.on('SIGTERM', () => { this.handleShutdown(); });
  }

  /**
   * Get TokenPool
   * @param pairAddress 
   */
  private getPool(pairAddress: string) {
    return this.pools[pairAddress];
  }

  /**
   * Get or Create TokenPool
   * @param pairAddress 
   */
  private getOrCreatePool = (pairAddress: string) => {
    if (!this.getPool(pairAddress)) {
      this.pools[pairAddress] = new TokenPool(pairAddress);
    }
    return this.pools[pairAddress];
  }

  /**
   * Add order to associated TokenPool
   * @param orderId 
   * @param order 
   */
  private addPoolOrder = async (orderId: string, order: IUniTradeOrder) => {
    const pairAddress = await this.dependencies.providers.uniSwap?.getPairAddress(order.tokenIn, order.tokenOut);
    const pool = this.getOrCreatePool(pairAddress);
    pool.addOrder(orderId, order);
  };

  /**
   * Remove order from associated TokenPool
   * @param orderId 
   * @param order 
   */
  private removePoolOrder = async (orderId: string, order: IUniTradeOrder) => {
    const pairAddress = await this.dependencies.providers.uniSwap?.getPairAddress(order.tokenIn, order.tokenOut);

    const orderPool = this.getPool(pairAddress);

    if (orderPool) {
      orderPool.removeOrder(orderId);
    }
  }

  /**
   * Create listener for UniSwap pool updates
   * @param pairAddress 
   */
  private createPoolChangeListener = async (pairAddress: string) => { 
    const pairContract = await this.dependencies.providers.uniSwap?.getOrCreatePairContract(pairAddress);
    
    log('Subscribing to UniSwap Sync events for pairAddress %s', pairAddress);
    this.poolListeners[pairAddress] = await pairContract.events.Sync(async (err: Error, event: any) => {
      if (err) throw err;
      log('Got UniSwap Sync event for pairAddress %s: %O', pairAddress, event);
      const ordersKeys = Object.keys(this.pools[pairAddress].orders);
      if (ordersKeys.length) {
        for (let o = 0; o < ordersKeys.length; o += 1) {
          const order = this.pools[pairAddress].orders[ordersKeys[o]];
          const shouldExecute = await this.dependencies.providers.uniSwap?.shouldPlaceOrder(order);

          // THIS PART NEEDS TO BE TESTED STILL

          log('Should execute order #%s?', order.orderId, shouldExecute);
          if (shouldExecute) {

            // let uniswap calculate the gas cost automatically
            await this.dependencies.providers.uniTrade?.executeOrder(order.orderId);

            // remove the subscription
            this.poolListeners[pairAddress].removeAllListeners();
            delete this.poolListeners[pairAddress];
            // remove the order
            this.pools[pairAddress].removeOrder(order.orderId);
          }
        }
      }
    });
  }

  /**
   * Create listeners for UniTrade order events
   */
  private createOrderListeners = async () => {
    // subscribe to UniTrade events to keep active orders up-to-date
    const uniTradeEvents = this.dependencies.providers.uniTrade?.contract.events;
  
    log('Subscribing to UniTrade OrderPlaced events...');
    this.orderListeners.OrderPlaced = await uniTradeEvents.OrderPlaced((err: Error, event: any) => {
      if (err) throw err;
      log('Got OrderPlaced event - %O', event);
    });
    this.orderListeners.OrderPlaced.on('data', (event: any) => {
      if (event.returnValues) {
        const order = event.returnValues as IUniTradeOrder;
        this.addPoolOrder(order.orderId, order);
      }
    });
    
    log('Subscribing to UniTrade OrderCancelled events...');
    this.orderListeners.OrderCancelled = await uniTradeEvents.OrderCancelled((err: Error, event: any) => {
      if (err) throw err;
      log('Got OrderCancelled event - %O', event);
    });
    this.orderListeners.OrderCancelled.on('data', (event: any) => {
      if (event.returnValues) {
        const order = event.returnValues as IUniTradeOrder;
        this.removePoolOrder(order.orderId, order);
      }
    });
    
    log('Subscribing to UniTrade OrderExecuted events...');
    this.orderListeners.OrderExecuted = await uniTradeEvents.OrderExecuted((err: Error, event: any) => {
      if (err) throw err;
      log('Got OrderExecuted event - %O', event);
    });
    this.orderListeners.OrderExecuted.on('data', (event: any) => {
      if (event.returnValues) {
        const order = event.returnValues as IUniTradeOrder;
        this.removePoolOrder(order.orderId, order);
      }
    });
  }

  /**
   * Main function
   */
  private async start() {
    try {
      log('Started UniTrade executor service');

      const web3 = new Web3(config.ropsten.uri);

      this.dependencies = loader(web3);
  
      this.activeOrders = await this.dependencies.providers.uniTrade?.listOrders() || [];
  
      log('Got %s active orders', this.activeOrders.length);

      // Get a list of unique token sets from the open orders
      if (this.activeOrders.length) {
        log('Initializing TokenPools...');
        for (let i = 0; i < this.activeOrders.length; i += 1) {
          const order = this.activeOrders[i];
          await this.addPoolOrder(order.orderId, order);
        }
      }

      log('Created %s pool(s)', Object.keys(this.pools).length);
  
      const poolsKeys = Object.keys(this.pools);
      if (poolsKeys.length) {
        for (let p = 0; p < poolsKeys.length; p += 1) {
          // For each unique token set, call the UniSwap smart contract and subscribe to price changes for that pool
          this.createPoolChangeListener(poolsKeys[p]);
        }
      }

      await this.createOrderListeners();
    } catch (err) {
      log('fatal error: %O', err);
      this.handleShutdown(1);
    }
  }
}

const app = new UniTradeExecutorService();
