import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_AUCTION_PACKAGE_ID,
  TESTNET_AUCTION_PACKAGE_ID,
  MAINNET_AUCTION_PACKAGE_ID,
} from "./constants";
// import { createNetworkConfig } from "@mysten/dapp-kit";

// Mock implementation
const createNetworkConfig = (config: any) => ({
  networkConfig: config,
  useNetworkVariable: (key: string) => "mock-value",
  useNetworkVariables: () => ({}),
});

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        auctionPackageId: DEVNET_AUCTION_PACKAGE_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        auctionPackageId: TESTNET_AUCTION_PACKAGE_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        auctionPackageId: MAINNET_AUCTION_PACKAGE_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
