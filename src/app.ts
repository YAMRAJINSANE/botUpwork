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
  console.log("Private key", privateKey);

  const arbitrumWallet = new ethers.Wallet(privateKey, arbitrumRpcProvider);

  const claimStartingAt = 16890400;

  console.log("Ethereum Chain Block Number", ethChainBlockNumber);

  //   while (ethChainBlockNumber < claimStartingAt) {
  //     // sleep for 1 minute and then try again
  //     await new Promise((resolve) => setTimeout(resolve, 60000));
  //     ethChainBlockNumber = await ethereumRpcProvider.getBlockNumber();
  //   }

  const tokenDistributerContract = new ethers.Contract(
    "0x67a24ce4321ab3af51c2d0a4801c3e111d88c9d9",
    abi.arb,
    arbitrumWallet
  );

  const claimableTokens = await tokenDistributerContract.claimableTokens(
    "0x4E53051c6Bd7dA2Ad2aa22430AD8543431007D23"
  );
  console.log("Claimable Tokens", claimableTokens.toString());

  let gasLimit = await tokenDistributerContract.estimateGas.claim();
  gasLimit = gasLimit.mul(4).div(3);
  console.log("Gaslimit", gasLimit);
  const claimTx = await tokenDistributerContract.claim({
    gasLimit,
  });
  console.log("Claim Tx", claimTx.hash);
  let receipt = await claimTx.wait();

  // now transfer token to different address

  const erc20Contract = new ethers.Contract(
    "0x912ce59144191c1204e64559fe8253a0e49e6548",
    abi.erc20,
    arbitrumWallet
  );
  const balance = await erc20Contract.balanceOf(arbitrumWallet.address);
  const tx = await erc20Contract.transfer(
    destinationAddress,
    balance.toString()
  );
  receipt = await tx.wait();
})();
