// /**
//  * UniTrade Provider Test
//  */
// // import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';
// import IERC20 from './IERC20.json';
// import { ChainId, WETH } from '@uniswap/sdk'
// import { expect, use } from 'chai';
// import { deployContract, deployMockContract, MockProvider, solidity } from 'ethereum-waffle';
// import { describe, it } from 'mocha';
// import sinon from 'sinon';
// import sinonChai from 'sinon-chai';

// import { UniTradeProvider } from '../src/providers/unitrade-provider';
// import UniTrade from '../src/lib/abis/UniTrade.json';
// import IUniswapV2Factory from '../src/lib/abis/IUniswapV2Factory.json'
// import IUniswapV2Router from '../src/lib/abis/IUniswapV2Router02.json'
// import { IDependencies } from '../src/lib/types';
// import { getUniswapPairAddress } from './helpers';

// const Web3 = require('web3');

// use(sinonChai);
// use(solidity)

// describe('UniTrade Provider', function() {
//   const mockDependencies = {
//     providers: {},
//   } as IDependencies;

//   let provider: UniTradeProvider;
//   let listOrdersSpy: any;

//   const ethProvider = new MockProvider();
//   const [wallet, wallet2] = ethProvider.getWallets();
//   let mockUniswapV2Factory: any
//   let mockUniswapV2Router: any
//   let unitrade: any
//   let tokenA: any
//   let tokenB: any
//   let wethAddress: string
//   let zeroAddress: string = '0x0000000000000000000000000000000000000000'

//   beforeEach(async () => {
//     provider = new UniTradeProvider(mockDependencies);

//     const chainId = ChainId.ROPSTEN;
//     wethAddress = WETH[chainId].address;
//     mockUniswapV2Factory = await deployMockContract(wallet, IUniswapV2Factory.abi)
//     mockUniswapV2Router = await deployMockContract(wallet, IUniswapV2Router.abi)
//     await mockUniswapV2Router.mock.factory.returns(mockUniswapV2Factory.address)
//     await mockUniswapV2Router.mock.WETH.returns(wethAddress)
//     unitrade = await deployContract(wallet, UniTrade, [mockUniswapV2Router.address])
//     tokenA = await deployMockContract(wallet, IERC20.abi)
//     tokenB = await deployMockContract(wallet, IERC20.abi)
//   })

//   describe('listOrders()', function() {
//     it('should call the UniTrade contract to get a list of active orders', async function() {
//       const params1: any[] = [tokenA.address, tokenB.address, 100, 10, 1000, { value: 1000 }]
//       const params2: any[] = [tokenB.address, tokenA.address, 150, 15, 2000, { value: 2000 }]
      
//       const pairAddress1 = getUniswapPairAddress(params1[0], params1[1])
//       await mockUniswapV2Factory.mock.getPair.returns(pairAddress1)
//       await tokenA.mock.transferFrom.withArgs(wallet.address, unitrade.address, 100).returns(true)
      
//       const orderId1 = await unitrade.callStatic.placeOrderTokensForTokens(...params1)
//       expect(orderId1).to.equal(0)
//       await unitrade.placeOrderTokensForTokens(...params1)
      
//       const pairAddress2 = getUniswapPairAddress(params2[0], params2[1])
//       await mockUniswapV2Factory.mock.getPair.returns(pairAddress2)
//       await tokenB.mock.transferFrom.withArgs(wallet.address, unitrade.address, 150).returns(true)
      
//       const orderId2 = await unitrade.callStatic.placeOrderTokensForTokens(...params2)
//       expect(orderId2).to.equal(1)
//       await unitrade.placeOrderTokensForTokens(...params2);
      
//       expect(await unitrade.callStatic.listActiveOrders()).to.be.an('array').that.has.lengthOf(2).and.to.eql([orderId1, orderId2])

//       // console.log(wallet2.address);

//       const activeOrders = await provider.listOrders(wallet2.address);

//       console.log('Active orders: ', activeOrders);
      
//       // expect(activeOrders).to.be.an('array').that.has.lengthOf(2).and.to.eql([orderId1, orderId2])
//       return;
//     });
//   });
  
//   describe('executeOrder()', function() {
//     it('should call the UniTrade contract to execute a given order', function() {
//       return;
//     });
//   });
// });
