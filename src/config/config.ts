import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export interface IConfig {
  account: {
    privateKey: string;
  };
  provider: {
    uri: string;
  };
  unitrade: {
    address: string;
  };
  uniswap: {
    factoryAddress: string;
    routerAddress: string;
  };
  percentSlippage: string;
  gasPriceLevel: string;
  badOrderRetry: string;
}

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`env var ${key} not set`);
  }

  return value;
};

export const config: IConfig = {
  account: {
    privateKey: getEnv("ACCOUNT_PRIVATE_KEY"),
  },
  provider: {
    uri: getEnv("PROVIDER_URI"),
  },
  unitrade: {
    address: getEnv("UNITRADE_ADDRESS"),
  },
  uniswap: {
    factoryAddress: getEnv("UNISWAP_FACTORY_ADDRESS"),
    routerAddress: getEnv("UNISWAP_ROUTER_ADDRESS"),
  },
  percentSlippage: getEnv("PERCENT_SLIPPAGE"),
  gasPriceLevel: getEnv("GAS_PRICE_LEVEL"),
  badOrderRetry: getEnv("BAD_ORDER_RETRY"),
};
