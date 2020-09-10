import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export interface IConfig {
  user: {
    account: string;
  };
  ropsten: {
    uri: string;
  };
  unitrade: {
    address: string;
  };
  uniswap: {
    factoryAddress: string;
    routerAddress: string;
  };
}

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`env var ${key} not set`);
  }

  return value;
};

export const config: IConfig = {
  user: {
    account: getEnv('USER_ACCOUNT'),
  },
  ropsten: {
    uri: getEnv('ROPSTEN_URI'),
  },
  unitrade: {
    address: getEnv('UNITRADE_ADDRESS'),
  },
  uniswap: {
    factoryAddress: getEnv('UNISWAP_FACTORY_ADDRESS'),
    routerAddress: getEnv('UNISWAP_ROUTER_ADDRESS'),
  },
};
