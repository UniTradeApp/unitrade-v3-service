/**
 * Token Pool Class
 */
import { IUniTradeV2Order } from "../types";

export class TokenPool {
  public pair: string;
  public orders: { [id: string]: IUniTradeV2Order };

  constructor(pair: string, orders: { [id: string]: IUniTradeV2Order } = {}) {
    this.pair = pair;
    this.orders = orders;
  }

  public addOrder(orderId: number, order: IUniTradeV2Order) {
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

  public updateOrder(orderId: number, order: IUniTradeV2Order) {
    if (this.orders[orderId]) {
      this.orders[orderId] = order;
    }
  }
}
