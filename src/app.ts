import * as dotenv from "dotenv";

import { ethers } from "ethers";
import abi from "./utils/abi";
// setup environment variables
dotenv.config();

(async () => {
  const arbitrumRpcProvider = new ethers.providers.JsonRpcProvider(
    "https://long-spring-vineyard.arbitrum-mainnet.discover.quiknode.pro/6b1d41c57c06db9b758cdc71d7ee5392ada3468a/"
  );
  const ethereumRpcProvider = new ethers.providers.JsonRpcProvider(
    "https://mainnet.infura.io/v3/7b6e08e0772b4c93a860cf2d40f8b400"
  );

  let ethChainBlockNumber = await ethereumRpcProvider.getBlockNumber();

  const privateKey = process.env.PRIVATE_KEY || "";
  const destinationAddress = process.env.DESTINATION_ADDRESS || "";
  const arbitrumTokenAddress = process.env.ARBITRUM_TOKEN_ADDRESS || "";

  const tokenDistributerAddress = "0x67a24ce4321ab3af51c2d0a4801c3e111d88c9d9";
  const arbitrumWallet = new ethers.Wallet(privateKey, arbitrumRpcProvider);

  const claimStartingAt = 16890400;

  console.log("Ethereum Chain Block Number", ethChainBlockNumber);

  while (ethChainBlockNumber < claimStartingAt) {
    // sleep for 5 seconds and then try again
    await new Promise((resolve) => setTimeout(resolve, 5000));
    ethChainBlockNumber = await ethereumRpcProvider.getBlockNumber();
  }

  const tokenDistributerContract = new ethers.Contract(
    tokenDistributerAddress,
    abi.tokenDistributer,
    arbitrumWallet
  );

  let gasLimit = await tokenDistributerContract.estimateGas.claim();
  gasLimit = gasLimit.mul(4).div(3);
  console.log("Gaslimit", gasLimit);
  let tx = await tokenDistributerContract.claim({
    gasLimit,
  });
  console.log("Claim Tx", tx.hash);
  let receipt = await tx.wait();

  // now transfer token to different address

  const erc20Contract = new ethers.Contract(
    arbitrumTokenAddress,
    abi.erc20,
    arbitrumWallet
  );
  let balance = await erc20Contract.balanceOf(arbitrumWallet.address);
  console.log("Balance before", balance.toString());

  tx = await erc20Contract.transfer(destinationAddress, balance.toString());
  receipt = await tx.wait();

  balance = await erc20Contract.balanceOf(arbitrumWallet.address);
  console.log("Balance After", balance.toString());
})();
