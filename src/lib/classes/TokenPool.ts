/**
 * Token Pool Class
 */
import { IUniTradeOrder } from '../types';

export class TokenPool {
  public pair: string;
  public orders: { [id: string]: IUniTradeOrder };

  constructor(pair: string, orders: { [id: string]: IUniTradeOrder } = {}) {
    this.pair = pair;
    this.orders = orders;
  }

  public addOrder(orderId: string, order: IUniTradeOrder) {
    if (!this.orders[orderId]) {
      this.orders[orderId] = order;
    }
  }

  public getOrder(orderId: string) {
    return this.orders[orderId];
  }

  public removeOrder(orderId: string) {
    if (this.orders[orderId]) {
      delete this.orders[orderId];
    }
  }

  public updateOrder(orderId: string, order: IUniTradeOrder) {
    if (this.orders[orderId]) {
      this.orders[orderId] = order;
    }
  }
}
