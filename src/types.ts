import type { CollateralParams as CollateralParams_, Collateral as Collateral_, InterestRateParams as InterestRateParams_ } from "granite-math-sdk";

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

export type CollateralParams = CollateralParams_ & { liquidationLTV:number, decimals: number };

export type Collateral = Collateral_;


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
    collateralParams: Record<string, CollateralParams>;
}


export type DbOpRs = 0 | 1 | 2;