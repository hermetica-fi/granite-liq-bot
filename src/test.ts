import { calculateAccountHealth, convertDebtSharesToAssets } from "granite-math-sdk";
import { IR_PARAMS_SCALING_FACTOR, SCALING_FACTOR } from "./constants";
import { pool } from "./db";

import type { InterestRateParams, PriceFeed } from "./types";
import { getMarketState } from "./worker/market-sync/shared";

const dbClient = await pool.connect();

export const marketState = await getMarketState(dbClient, "testnet");

if (!marketState) {
    throw new Error("No market state found");
}

const irParamsInput: InterestRateParams = {
    urKink: marketState.irParams.urKink / 10 ** IR_PARAMS_SCALING_FACTOR,
    baseIR: marketState.irParams.baseIR / 10 ** IR_PARAMS_SCALING_FACTOR,
    slope1: marketState.irParams.slope1 / 10 ** IR_PARAMS_SCALING_FACTOR,
    slope2: marketState.irParams.slope2 / 10 ** IR_PARAMS_SCALING_FACTOR,
};

const borrower: {
    debtShares: number;
    collateralTokensDeposited: Record<string, number>;
} = {
    debtShares: 82595077484,
    collateralTokensDeposited: {
        'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': 90000000
    }
}

const currentDebt = convertDebtSharesToAssets(
    borrower.debtShares / 10 ** SCALING_FACTOR,
    marketState.debtParams.openInterest / 10 ** SCALING_FACTOR,
    marketState.debtParams.totalDebtShares / 10 ** SCALING_FACTOR,
    marketState.lpParams.totalAssets / 10 ** SCALING_FACTOR,
    irParamsInput,
    marketState.accrueInterestParams.lastAccruedBlockTime,
);




const getCollateralPrice = (collateral: string, priceFeed: PriceFeed): number => {
    for (const f of Object.keys(priceFeed)) {
        const name = collateral.split(".")[1];
        if (name.toLocaleLowerCase().includes(f.toLocaleLowerCase())) {
            return priceFeed[f as keyof PriceFeed];
        }
    }
    return 0;
}


const collaterals = Object.keys(borrower.collateralTokensDeposited).map(key => {
    const { decimals, liquidationLTV } = marketState.collateralParams[key];
    const price = getCollateralPrice(key, marketState.priceFeed);

    if (!price) {
        throw new Error(`No price found for ${key}`);
    }

    return {
        amount: borrower.collateralTokensDeposited[key] / 10 ** decimals,
        price: price / 10 ** decimals,
        liquidationLTV: liquidationLTV / 10 ** decimals,
    }
});

const health = calculateAccountHealth(collaterals, currentDebt);

console.log(health)