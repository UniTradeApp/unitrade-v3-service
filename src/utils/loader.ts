/**
 * World's Hackiest Dependency Injection
 */
import { IDependencies } from '../lib/types';
import { UniSwapProvider, UniTradeProvider, AccountProvider, EthGasStationProvider } from '../providers';
import Web3 from 'web3';

export const loader = (web3: Web3) => {
  const dependencies: IDependencies = {
    providers: {},
  };
  
  dependencies.providers.account = new AccountProvider(dependencies);
  dependencies.providers.account.init(web3);

  dependencies.providers.uniSwap = new UniSwapProvider(dependencies);
  dependencies.providers.uniSwap.init(web3);

  dependencies.providers.uniTrade = new UniTradeProvider(dependencies);
  dependencies.providers.uniTrade.init(web3);

  dependencies.providers.ethGasStation = new EthGasStationProvider(dependencies);
  dependencies.providers.ethGasStation.init(web3);

  return dependencies;
};
