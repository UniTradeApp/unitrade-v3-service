/**
 * Account Provider
 */
import debug from 'debug';
import Web3 from 'web3';

import { config } from '../config';
import { Dependency } from '../lib/classes';

const log = debug('unitrade-service:providers:account');

export class AccountProvider extends Dependency {
  private account: any;

  public init(web3: Web3) {
    this.setWeb3(web3);
    this.account = this.web3.eth.accounts.privateKeyToAccount(config.account.privateKey);
    this.web3.eth.accounts.wallet.add(this.account);
  }

  public address() {
    return this.account.address;
  }
}
