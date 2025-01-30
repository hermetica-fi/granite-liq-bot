import { pool } from "./db";
import { calcAccountLiquidationInfo } from "./worker/health-check/lib";

import { getMarketState } from "./worker/market-sync/shared";

const dbClient = await pool.connect();

export const marketState = await getMarketState(dbClient, "testnet");

if (!marketState) {
    throw new Error("No market state found");
}

const borrower: {
    debtShares: number;
    collateralTokensDeposited: Record<string, number>;
} = {
    debtShares: 1233675334672,
    collateralTokensDeposited: {
        'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': 658317537
    }
}

const a = calcAccountLiquidationInfo(borrower, marketState);

console.log(a)