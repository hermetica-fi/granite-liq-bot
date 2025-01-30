import { calculateAccountHealth, calculateAccountLiqLTV, calculateAccountMaxLTV, calculateLiquidationPoint, calculateTotalCollateralValue, convertDebtSharesToAssets } from "granite-math-sdk";
import { IR_PARAMS_SCALING_FACTOR, SCALING_FACTOR } from "./constants";
import { pool } from "./db";

import type { InterestRateParams, PriceFeed } from "./types";
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
    debtShares: 43213934616323,
    collateralTokensDeposited: {
        'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': 7000000000,
        'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc' : 500000000
    }
}

const irParamsInput: InterestRateParams = {
    urKink: marketState.irParams.urKink / 10 ** IR_PARAMS_SCALING_FACTOR,
    baseIR: marketState.irParams.baseIR / 10 ** IR_PARAMS_SCALING_FACTOR,
    slope1: marketState.irParams.slope1 / 10 ** IR_PARAMS_SCALING_FACTOR,
    slope2: marketState.irParams.slope2 / 10 ** IR_PARAMS_SCALING_FACTOR,
};

console.log('borrower.debtShares', borrower.debtShares / 10 ** SCALING_FACTOR);
console.log('marketState.debtParams.openInterest', marketState.debtParams.openInterest / 10 ** SCALING_FACTOR);
console.log('marketState.debtParams.totalDebtShares', marketState.debtParams.totalDebtShares / 10 ** SCALING_FACTOR);
console.log('marketState.lpParams.totalAssets', marketState.lpParams.totalAssets / 10 ** SCALING_FACTOR);
console.log('irParamsInput', irParamsInput);


const debtAssets = convertDebtSharesToAssets(
    borrower.debtShares / 10 ** SCALING_FACTOR,
    marketState.debtParams.openInterest / 10 ** SCALING_FACTOR,
    marketState.debtParams.totalDebtShares / 10 ** SCALING_FACTOR,
    marketState.lpParams.totalAssets / 10 ** SCALING_FACTOR,
    irParamsInput,
    Math.ceil(Math.floor(Date.now() / 1000) - marketState.accrueInterestParams.lastAccruedBlockTime),
);

console.log('debtAssets', debtAssets)

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
        maxLTV: 0.5, // !!!!
    }
});

const health = calculateAccountHealth(collaterals, debtAssets);

console.log('health', health)


const accountLiqLTV = calculateAccountLiqLTV(collaterals)

console.log('accountLiqLTV', accountLiqLTV)

const liquidationPoint =  calculateLiquidationPoint(
    accountLiqLTV,
    borrower.debtShares / 10 ** SCALING_FACTOR,
  

    marketState.debtParams.openInterest / 10 ** SCALING_FACTOR,
    marketState.debtParams.totalDebtShares / 10 ** SCALING_FACTOR,
    marketState.lpParams.totalAssets / 10 ** SCALING_FACTOR,
    irParamsInput,
    Math.ceil(Math.floor(Date.now() / 1000) - marketState.accrueInterestParams.lastAccruedBlockTime),
  )

  console.log('liquidationPoint', liquidationPoint)

  const totalCollateralValue = calculateTotalCollateralValue(collaterals)

  console.log('totalCollateralValue', totalCollateralValue)

  const liquidationRisk = liquidationPoint / totalCollateralValue;

  console.log('liquidationRisk', (liquidationRisk * 100).toFixed(2))

  
  const weightedMaxLtv = calculateAccountMaxLTV(collaterals)

  console.log('weightedMaxLtv', weightedMaxLtv)

  const renderAmountLiquidate = () => {
    const numerator = debtAssets - weightedMaxLtv * totalCollateralValue;
    const denominator = 1 - weightedMaxLtv * (1 + 0.1);

    const availableToLiquidate = numerator / denominator;

    return availableToLiquidate;
  };

  const amountLiquidate = liquidationRisk >= 1 ? renderAmountLiquidate() : 0;

  console.log('amountLiquidate', amountLiquidate)