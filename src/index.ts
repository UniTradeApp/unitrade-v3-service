#!/usr/bin/env node

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
    // process.on('SIGINT', () => { this.handleShutdown(); });
    // process.on('SIGTERM', () => { this.handleShutdown(); });
  }

  /**
   * Get or Create TokenPool
   * @param pairAddress 
   */
  private getOrCreatePool = (pairAddress: string) => {
    if (!this.pools[pairAddress]) {
      this.pools[pairAddress] = new TokenPool(pairAddress);
      this.createPoolChangeListener(pairAddress);
    }
    return this.pools[pairAddress];
  }

  /**
   * Add order to associated TokenPool
   * @param orderId 
   * @param order 
   */
  private addPoolOrder = async (orderId: number, order: IUniTradeOrder) => {
    try {
      const pairAddress = await this.dependencies.providers.uniSwap?.getPairAddress(order.tokenIn, order.tokenOut);
      const pool = this.getOrCreatePool(pairAddress);
      pool.addOrder(orderId, order);
    } catch (err) {
      log('%O', err);
    }
  };

  /**
   * Remove order from associated TokenPool
   * @param orderId 
   * @param order 
   */
  private removePoolOrder = async (orderId: number, order: IUniTradeOrder) => {
    try {
      const pairAddress = await this.dependencies.providers.uniSwap?.getPairAddress(order.tokenIn, order.tokenOut);
  
      const orderPool = this.pools[pairAddress];
  
      if (orderPool) {
        orderPool.removeOrder(orderId);
      }
    } catch (err) {
      log('%O', err);
    }
  }

  /**
   * Create listener for UniSwap pool updates
   * @param pairAddress 
   */
  private createPoolChangeListener = async (pairAddress: string) => { 
    try {
      const pairContract = await this.dependencies.providers.uniSwap?.getOrCreatePairContract(pairAddress);
      
      this.poolListeners[pairAddress] = await pairContract.events.Sync();
      this.poolListeners[pairAddress].on('data', async () => {
        log('Got UniSwap Sync event for pairAddress %s', pairAddress);
        // remove the subscription if no more orders
        if (!this.pools[pairAddress] || !this.pools[pairAddress].getOrderCount()) {
          this.poolListeners[pairAddress].removeAllListeners();
          delete this.poolListeners[pairAddress];
          delete this.pools[pairAddress];
        } else {
          const ordersKeys = Object.keys(this.pools[pairAddress].orders);
          if (ordersKeys.length) {
            for (let o = 0; o < ordersKeys.length; o += 1) {
              const order = this.pools[pairAddress].orders[ordersKeys[o]];
              if (order) {
                const shouldExecute = await this.dependencies.providers.uniSwap?.shouldPlaceOrder(order);
      
                log('Should execute order #%s?', order.orderId, shouldExecute);
                if (shouldExecute) {
      
                  // let uniswap calculate the gas cost automatically
                  await this.dependencies.providers.uniTrade?.executeOrder(order);
      
                  // remove the order
                  if (this.pools[pairAddress]) {
                    this.pools[pairAddress].removeOrder(order.orderId);
                  }
                }
              }
            } 
          }
        }
      });
      this.poolListeners[pairAddress].on('connected', () => {
        log('Listener connected to UniSwap Sync events for pairAddress %s', pairAddress);
      });
      this.poolListeners[pairAddress].on('error', (err) => {
        log(err);
      });
      this.poolListeners[pairAddress].on('end', async () => {
        log('Listener lost connection to UniSwap Sync events for pairAddress %s! Reconnecting...', pairAddress);
        this.createPoolChangeListener(pairAddress);
      });
    } catch (err) {
      log('%O', err);
    }
  }

  /**
   * Create listener for UniTrade OrderPlaced events
   */
  private createOrderPlacedListener = async () => {
    try {
      const uniTradeEvents = this.dependencies.providers.uniTrade?.contract.events;
  
      if (this.orderListeners.OrderPlaced) {
        this.orderListeners.OrderPlaced.removeAllListeners();
        delete this.orderListeners.OrderPlaced;
      }
  
      this.orderListeners.OrderPlaced = await uniTradeEvents.OrderPlaced();
      this.orderListeners.OrderPlaced.on('data', async (event: any) => {
        if (event.returnValues) {
          log('Received UniTrade OrderPlaced event for orderId: %s', event.returnValues.orderId);
          const order = event.returnValues as IUniTradeOrder;
          const shouldExecute = await this.dependencies.providers.uniSwap?.shouldPlaceOrder(order);
    
          log('Should execute order #%s?', order.orderId, shouldExecute);
          if (shouldExecute) {
            await this.dependencies.providers.uniTrade?.executeOrder(order);
          } else {
            this.addPoolOrder(order.orderId, order);
          }
        }
      });
      this.orderListeners.OrderPlaced.on('connected', () => {
        log('Listener connected to UniTrade OrderPlaced events');
      });
      this.orderListeners.OrderPlaced.on('error', (err) => {
        log(err);
      });
      this.orderListeners.OrderPlaced.on('end', async () => {
        log('Listener disconnected from UniTrade OrderPlaced events!');
        this.createOrderPlacedListener();
      });
    } catch (err) {
      throw err;
    }
  };

  /**
   * Create listener for UniTrade OrderCancelled events
   */
  private createOrderCancelledListener = async () => {
    try {
      const uniTradeEvents = this.dependencies.providers.uniTrade?.contract.events;
  
      if (this.orderListeners.OrderCancelled) {
        this.orderListeners.OrderCancelled.removeAllListeners();
        delete this.orderListeners.OrderCancelled;
      }

      this.orderListeners.OrderCancelled = await uniTradeEvents.OrderCancelled((err: Error) => {
        if (err) {
          log(err);
          return;
        }
      });
      this.orderListeners.OrderCancelled.on('data', async (event: any) => {
        if (event.returnValues) {
          log('Received UniTrade OrderCancelled event for orderId: %s', event.returnValues.orderId);
          const order = event.returnValues as IUniTradeOrder;
          this.removePoolOrder(order.orderId, order);
          log('removed pool order for orderId %s', event.returnValues.orderId);
  
          // remove the subscription if no more orders
          const pairAddress = await this.dependencies.providers.uniSwap?.getPairAddress(order.tokenIn, order.tokenOut);
          log('pair address: ', pairAddress);
          if (!this.pools[pairAddress] || this.pools[pairAddress].getOrderCount()) {
            if (this.poolListeners[pairAddress]) {
              this.poolListeners[pairAddress].removeAllListeners();
              delete this.poolListeners[pairAddress];
            }
            delete this.pools[pairAddress];
          }
        }
      });
      this.orderListeners.OrderCancelled.on('connected', () => {
        log('Listener connected to UniTrade OrderCancelled events');
      });
      this.orderListeners.OrderCancelled.on('error', (err) => {
        log(err);
      });
      this.orderListeners.OrderCancelled.on('end', async () => {
        log('Listener disconnected from UniTrade OrderCancelled events!');
        this.createOrderCancelledListener();
      });
    } catch (err) {
      throw err;
    }
  };
 
  /**
   * Create listener for UniTrade OrderExecuted events
   */
  private createOrderExecutedListener = async () => {
    try {
      const uniTradeEvents = this.dependencies.providers.uniTrade?.contract.events;
  
      if (this.orderListeners.OrderExecuted) {
        this.orderListeners.OrderExecuted.removeAllListeners();
        delete this.orderListeners.OrderExecuted;
      }

      this.orderListeners.OrderExecuted = await uniTradeEvents.OrderExecuted((err: Error) => {
        if (err) {
          log(err);
          return;
        }
      });
      this.orderListeners.OrderExecuted.on('data', async (event: any) => {
        if (event.returnValues) {
          log('Received UniTrade OrderExecuted event for orderId: %s', event.returnValues.orderId);
          const order = event.returnValues as IUniTradeOrder;
          this.removePoolOrder(order.orderId, order);
          log('removed pool order for orderId %s', event.returnValues.orderId);
  
          // remove the subscription if no more orders
          const pairAddress = await this.dependencies.providers.uniSwap?.getPairAddress(order.tokenIn, order.tokenOut);
          if (!this.pools[pairAddress] || this.pools[pairAddress].getOrderCount()) {
            if (this.poolListeners[pairAddress]) {
              this.poolListeners[pairAddress].removeAllListeners();
              delete this.poolListeners[pairAddress];
            }
            delete this.pools[pairAddress];
          }
        }
      });
      this.orderListeners.OrderExecuted.on('connected', () => {
        log('Listener connected to UniTrade OrderExecuted events');
      });
      this.orderListeners.OrderExecuted.on('error', (err) => {
        log(err);
      });
      this.orderListeners.OrderExecuted.on('end', async () => {
        log('Listener disconnected from UniTrade OrderExecuted events!');
        this.createOrderExecutedListener();
      });
    } catch (err) {
      throw err;
    }
  };

  /**
   * Main function
   */
  private async start() {
    try {
      log('Starting UniTrade executor service...');

      const web3 = new Web3(config.provider.uri);

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

      // Subscribe to UniTrade events to keep active orders up-to-date
      await this.createOrderPlacedListener();
      await this.createOrderCancelledListener();
      await this.createOrderExecutedListener();

      log('UniTrade executor service is now running!');
    } catch (err) {
      log('%O', err);
    }
  }
}

const app = new UniTradeExecutorService();
