import type { InterestRateParams as InterestRateParams_ } from "granite-math-sdk";

export type NetworkName = "mainnet" | "testnet";

export type InterestRateParams = InterestRateParams_;

export type LpParams = {
    totalAssets: number;
    totalShares: number;
}

export type DebtParams = {
    openInterest: number;
    totalDebtShares: number;
}

export type AccrueInterestParams = {
    lastAccruedBlockTime: number;
}

export type PriceFeed = {
    btc: number;
    eth: number;
    usdc: number;
}

export type MarketState = {
    irParams: InterestRateParams;
    lpParams: LpParams;
    accrueInterestParams: AccrueInterestParams;
    debtParams: DebtParams;
    priceFeed: PriceFeed;
}
