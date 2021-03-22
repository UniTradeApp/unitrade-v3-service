/**
 * Setup Test Environment
 */
import IUniswapV2Router02 from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import Web3 from "web3";
import { AbiItem, toBN, toWei } from "web3-utils";

import { config } from "../src/config";
import IUniTrade from "../src/lib/abis/UniTradeOrderBook.json";
import IERC20 from "./IERC20.json";

const TOKEN_ADDRESSES = {
  DAI: "0xad6d458402f60fd3bd25163575031acdce07538d",
};

async function test() {
  const web3 = new Web3(config.provider.uri);

  // create contract objects
  const swapRouter = new web3.eth.Contract(IUniswapV2Router02.abi as AbiItem[], config.uniswap.routerAddress);
  const uniTrade = new web3.eth.Contract(IUniTrade.abi as AbiItem[], config.unitrade.address);
  const daiContract = new web3.eth.Contract(IERC20.abi as AbiItem[], TOKEN_ADDRESSES.DAI);

  const wethAddress = await swapRouter.methods.WETH().call();

  // set up account
  const account = web3.eth.accounts.privateKeyToAccount(config.account.privateKey);
  web3.eth.accounts.wallet.add(account);

  // call() options
  const callOpts = {
    from: account.address,
  };

  const daiDecimals = await daiContract.methods.decimals().call(callOpts);

  // set order params
  const executorFee = 1;
  const gasLimit = 1000000;

  const order1TokenInAmount = toWei("0.01");
  const order1TokenOutAmount = toBN(4.72 * Math.pow(10, daiDecimals));
  const orderParams1: any[] = [
    wethAddress,
    TOKEN_ADDRESSES.DAI,
    order1TokenInAmount,
    order1TokenOutAmount,
    executorFee,
  ];

  let activeOrders = await uniTrade.methods.listActiveOrders().call(callOpts);

  // Place some orders

  if (!activeOrders.length || activeOrders.length < 2) {
    await uniTrade.methods.placeOrderEthForTokens(...orderParams1).send({
      from: account.address,
      gas: gasLimit,
      value: order1TokenInAmount + executorFee,
    });

    if (activeOrders.length < 2) {
      await uniTrade.methods.placeOrderEthForTokens(...orderParams1).send({
        from: account.address,
        gas: gasLimit,
        value: order1TokenInAmount + executorFee,
      });
    }
  }
}

test();
