import { Contract } from "ethers"
import { getCreate2Address, solidityKeccak256 } from "ethers/lib/utils"
import { FACTORY_ADDRESS, INIT_CODE_HASH } from '@uniswap/sdk'

export const getUniswapPairAddress = (tokenA: Contract["address"], tokenB: Contract["address"]) => {
  return getCreate2Address(
    FACTORY_ADDRESS,
    solidityKeccak256(['address', 'address'], [tokenA, tokenB]),
    INIT_CODE_HASH
  );
}