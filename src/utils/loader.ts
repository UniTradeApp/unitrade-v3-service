/**
 * Dependency Loader
 */
import { IDependencies } from '../lib/types';
import { UniSwapProvider, UniTradeProvider } from '../providers';

export const loader = () => {
  const dependencies: IDependencies = {
    providers: {},
  };
  
  dependencies.providers.uniSwap = new UniSwapProvider(dependencies);
  dependencies.providers.uniTrade = new UniTradeProvider(dependencies);

  return dependencies;
};
