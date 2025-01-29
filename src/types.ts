import type { InterestRateParams as InterestRateParams_ } from "granite-math-sdk";

export type NetworkName = "mainnet" | "testnet";

export type InterestRateParams = InterestRateParams_;

export type LpParams = {
    totalAssets: number;
    totalShares: number;
}

export type AccrueInterestParams = {
    lastAccruedBlockTime: number;
}