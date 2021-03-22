/**
 * Dependency Base Class
 */
import Web3 from "web3";
import { IDependencies } from "../types";

export class Dependency {
  dependencies: IDependencies = {
    providers: {},
  };
  web3: Web3;

  constructor(dependencies: IDependencies) {
    this.dependencies = dependencies;
  }

  public setWeb3(web3: Web3) {
    this.web3 = web3;
  }
}
