import debug from "debug";
import fetch from "node-fetch";
import Web3 from "web3";
import { config } from "../config";
import { Dependency } from "../lib/classes";

const log = debug("unitrade-service:providers:ethgasstation");

export interface IGasPriceLevels {
  [key: string]: number;
}

export class EthGasStationProvider extends Dependency {
  private currentGasPrices: IGasPriceLevels;
  private retryInterval: number;

  public init = async (web3: Web3) => {
    this.setWeb3(web3);
    this.retryInterval = 25000;
    this.getCurrentGasPricesInWei();
  };

  public getEstimatedGasForOrder = async (orderId: number): Promise<number | undefined> => {
    log("Estimating gas for order %s", orderId);
    try {
      return await this.dependencies.providers.uniTrade?.contract.methods.executeOrder(orderId).estimateGas({
        from: this.dependencies.providers.account?.address(),
      });
    } catch (err) {
      log("Error estimating gas for order %s: %O", orderId, err);
      throw err;
    }
  };

  public getPreferredGasPrice = () => {
    const priceLevel = config.gasPriceLevel?.toLocaleLowerCase();
    if (!priceLevel) {
      throw new Error("No gas price level configured.");
    }
    if (!this.currentGasPrices) {
      throw new Error("No current gas prices available.");
    }
    return this.currentGasPrices[priceLevel];
  };

  private getEthereumGasPricesInWei = async (): Promise<void> => {
    const response = await fetch("https://ethgasstation.info/json/ethgasAPI.json");
    if (response.ok) {
      const json = await response.json();
      let gasPrices = {
        low: (Number(json.safeLow) / 10) * Math.pow(10, 9),
        medium: (Number(json.average) / 10) * Math.pow(10, 9),
        high: (Number(json.fast) / 10) * Math.pow(10, 9),
      };

      this.currentGasPrices = gasPrices;
      log("Done. Gas prices now set to %s", gasPrices);
      this.retryInterval = 25000;
      setTimeout(this.getCurrentGasPricesInWei, this.retryInterval);
    } else {
      log("Failed to fetch gas prices/");
      this.retryInterval *= 2;
      setTimeout(this.getCurrentGasPricesInWei, this.retryInterval);
      throw new Error("Unable to retrieve gas prices");
    }
  };

  // Note: Since there isn't a gasstation-like API available in BSC
  // We are using current gasPrice from the network instead
  private getSmartChainGasPricesInWei = async (): Promise<void> => {
    const low = Number(await this.web3.eth.getGasPrice());
    const medium = low * 1.1;
    const high = low * 1.2;

    const gasPrices = {
      low,
      medium,
      high,
    };

    this.currentGasPrices = gasPrices;
    log("Done. Gas prices now set to %s", gasPrices);
    this.retryInterval = 25000;
    setTimeout(this.getCurrentGasPricesInWei, this.retryInterval);
  };

  private getCurrentGasPricesInWei = async (): Promise<void> => {
    log("Fetching gas prices...");
    const chainId = await this.web3.eth.net.getId();

    // Binance Smart Chain
    if (chainId === 56) {
      await this.getSmartChainGasPricesInWei();
    } else {
      await this.getEthereumGasPricesInWei();
    }
  };
}
