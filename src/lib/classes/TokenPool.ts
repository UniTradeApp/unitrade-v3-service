/**
 * Token Pool Class
 */
import { IUniTradeOrder } from "../types";

export class TokenPool {
  public pair: string;
  public orders: { [id: string]: IUniTradeOrder };

  constructor(pair: string, orders: { [id: string]: IUniTradeOrder } = {}) {
    this.pair = pair;
    this.orders = orders;
  }

  public addOrder(orderId: number, order: IUniTradeOrder) {
    if (!this.orders[orderId]) {
      this.orders[orderId] = order;
    }
  }

  public getOrder(orderId: number) {
    return this.orders[orderId];
  }

  public getOrderCount() {
    return Object.keys(this.orders).length;
  }

  public removeOrder(orderId: number) {
    if (this.orders[orderId]) {
      delete this.orders[orderId];
    }
  }

  public updateOrder(orderId: number, order: IUniTradeOrder) {
    if (this.orders[orderId]) {
      this.orders[orderId] = order;
    }
  }
}
