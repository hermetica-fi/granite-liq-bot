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

export type CollateralParams = CollateralParams_ & { liquidationLTV: number, decimals: number, maxLTV: number };

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

export type Borrower = {
    address: string,
    network: NetworkName,
    lpShares: string,
    checkFlag: 0 | 1
}

export type UserPosition = {
    address: string,
    borrowedAmount: number,
    borrowedBlock: number,
    debtShares: number,
    collaterals: string[]
}

export type UserCollateral = {
    id: number,
    address: string,
    collateral: string,
    amount: number
}

export type BorrowerStatus = {
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    liquidateAmt: number
}

export type BorrowerStatusEntity = BorrowerStatus & { address: string }