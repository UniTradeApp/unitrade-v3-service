/**
 * Setup Test Environment
 */
import IUniswapV2Factory from '@uniswap/v2-core/build/IUniswapV2Factory.json';
import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import Web3 from 'web3';
import { AbiItem, toBN, toWei } from 'web3-utils';

import { config } from '../src/config';
import IUniTrade from '../src/lib/abis/UniTrade.json';
import IERC20 from './IERC20.json';

const TOKEN_ADDRESSES = {
  DAI: '0xad6d458402f60fd3bd25163575031acdce07538d',
};

async function app() {
  const web3 = new Web3(config.ropsten.uri);
  
  console.log('Init');

  // create contract objects
  const swapFactory = new web3.eth.Contract(IUniswapV2Factory.abi as AbiItem[], config.uniswap.factoryAddress);
  const swapRouter = new web3.eth.Contract(IUniswapV2Router02.abi as AbiItem[], config.uniswap.routerAddress);
  const uniTrade = new web3.eth.Contract(IUniTrade.abi as AbiItem[], config.unitrade.address);

  const wethAddress = await swapRouter.methods.WETH().call();

  const wethContract = new web3.eth.Contract(IERC20.abi as AbiItem[], wethAddress);
  const daiContract = new web3.eth.Contract(IERC20.abi as AbiItem[], TOKEN_ADDRESSES.DAI);

  // set up account
  const account = web3.eth.accounts.privateKeyToAccount(config.account.privateKey);
  web3.eth.accounts.wallet.add(account);

  // call() options
  const callOpts = {
    from: account.address,
  };

  const wethDecimals = 18;
  const daiDecimals = await daiContract.methods.decimals().call(callOpts);

  // set order params
  const incentiveFee = 1;
  const gasLimit = 1000000;
  
  const order1TokenInAmount = 0.01 * 10^wethDecimals;
  const order1TokenOutAmount = 5.4 * 10^daiDecimals;
  const orderParams1: any[] = [wethAddress, TOKEN_ADDRESSES.DAI, order1TokenInAmount, order1TokenOutAmount, incentiveFee];

  const order2TokenInAmount = 0.01 * 10^wethDecimals;
  const order2TokenOutAmount = 5.4 * 10^daiDecimals;
  const orderParams2: any[] = [wethAddress, TOKEN_ADDRESSES.DAI, order2TokenInAmount, order2TokenOutAmount, incentiveFee];
  
  let activeOrders = await uniTrade.methods.getOrder('0').call(callOpts);

  // Place some orders

  if (!activeOrders.length || activeOrders.length < 2) {
    const orderResult1 = await uniTrade.methods.placeOrderEthForTokens(...orderParams1).send({
      from: account.address,
      gas: gasLimit,
      value: order1TokenInAmount + incentiveFee
    });

    if (activeOrders.length < 2) {
      const orderResult2 = await uniTrade.methods.placeOrderEthForTokens(...orderParams2).send({
        from: account.address,
        gas: gasLimit,
        value: order2TokenInAmount + incentiveFee
      });
    }
  }
  
  activeOrders = await uniTrade.methods.getOrder('0').call(callOpts);
}

app();
