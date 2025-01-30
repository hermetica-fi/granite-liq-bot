import { calculateAccountHealth, calculateAccountLiqLTV, calculateAccountMaxLTV, calculateLiquidationPoint, calculateTotalCollateralValue, convertDebtSharesToAssets } from "granite-math-sdk";
import { IR_PARAMS_SCALING_FACTOR, SCALING_FACTOR } from "../../constants";
import type { InterestRateParams, MarketState, PriceFeed } from "../../types";


const getCollateralPrice = (collateral: string, priceFeed: PriceFeed): number => {
    for (const f of Object.keys(priceFeed)) {
        const name = collateral.split(".")[1];
        if (name.toLocaleLowerCase().includes(f.toLocaleLowerCase())) {
            return priceFeed[f as keyof PriceFeed];
        }
    }
    return 0;
}

const calcAmountToLiquidate = (debtAssets: number, weightedMaxLtv: number, totalCollateralValue: number) => {
    const numerator = debtAssets - weightedMaxLtv * totalCollateralValue;
    const denominator = 1 - weightedMaxLtv * (1 + 0.1);
    const availableToLiquidate = numerator / denominator;
    return availableToLiquidate;
}

export const calcAccountLiquidationInfo = (borrower: {
    debtShares: number;
    collateralTokensDeposited: Record<string, number>;
}, marketState: MarketState) => {
    const irParams: InterestRateParams = {
        urKink: marketState.irParams.urKink / 10 ** IR_PARAMS_SCALING_FACTOR,
        baseIR: marketState.irParams.baseIR / 10 ** IR_PARAMS_SCALING_FACTOR,
        slope1: marketState.irParams.slope1 / 10 ** IR_PARAMS_SCALING_FACTOR,
        slope2: marketState.irParams.slope2 / 10 ** IR_PARAMS_SCALING_FACTOR,
    };

    const now = Date.now();
    const debtShares = borrower.debtShares / 10 ** SCALING_FACTOR;
    const openInterest = marketState.debtParams.openInterest / 10 ** SCALING_FACTOR;
    const totalDebtShares = marketState.debtParams.totalDebtShares / 10 ** SCALING_FACTOR;
    const totalAssets = marketState.lpParams.totalAssets / 10 ** SCALING_FACTOR;
    const timeDelta =Math.ceil(now / 1000) - marketState.accrueInterestParams.lastAccruedBlockTime;

    const debtAssets = convertDebtSharesToAssets(
        debtShares,
        openInterest,
        totalDebtShares,
        totalAssets,
        irParams,
        timeDelta,
    );

    const collaterals = Object.keys(borrower.collateralTokensDeposited).map(key => {
        const { decimals, liquidationLTV, maxLTV } = marketState.collateralParams[key];
        const price = getCollateralPrice(key, marketState.priceFeed);

        if (!price) {
            throw new Error(`No price found for ${key}`);
        }

        return {
            amount: borrower.collateralTokensDeposited[key] / 10 ** decimals,
            price: price / 10 ** decimals,
            liquidationLTV: liquidationLTV / 10 ** decimals,
            maxLTV: maxLTV / 10 ** decimals,
        }
    });

    const health = calculateAccountHealth(collaterals, debtAssets);

    const accountLiqLTV = calculateAccountLiqLTV(collaterals);

    const liquidationPoint = calculateLiquidationPoint(
        accountLiqLTV,
        debtShares,
        openInterest,
        totalDebtShares,
        totalAssets,
        irParams,
        timeDelta,
    );

    const totalCollateralValue = calculateTotalCollateralValue(collaterals);

    const liquidationRisk = liquidationPoint / totalCollateralValue;

    const weightedMaxLtv = calculateAccountMaxLTV(collaterals);

    const amountToLiquidate = liquidationRisk >= 1 ? calcAmountToLiquidate(debtAssets, weightedMaxLtv, totalCollateralValue) : 0;

    return {
        health,
        debt: debtAssets,
        collateral: totalCollateralValue,
        risk: liquidationRisk,
        liquidateAmt: amountToLiquidate
    }
}