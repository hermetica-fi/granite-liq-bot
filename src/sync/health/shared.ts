import {
    calculateAccountHealth, calculateAccountLiqLTV,
    calculateLiquidationPoint, calculateMaxRepayAmount, calculateTotalCollateralValue, convertDebtSharesToAssets
} from "granite-math-sdk";
import { IR_PARAMS_SCALING_FACTOR } from "../../constants";
import type { BorrowerStatus, InterestRateParams, MarketState, PriceFeed } from "../../types";


const getCollateralPrice = (collateral: string, priceFeed: PriceFeed): number => {
    for (const f of Object.keys(priceFeed)) {
        const name = collateral.split(".")[1];
        if (name.toLocaleLowerCase().includes(f.toLocaleLowerCase())) {
            return priceFeed[f as keyof PriceFeed];
        }
    }
    return 0;
}



export const calcBorrowerStatus = (borrower: {
    debtShares: number;
    collateralsDeposited: Record<string, number>;
}, marketState: MarketState): BorrowerStatus => {
    const irParams: InterestRateParams = {
        urKink: marketState.irParams.urKink / 10 ** IR_PARAMS_SCALING_FACTOR,
        baseIR: marketState.irParams.baseIR / 10 ** IR_PARAMS_SCALING_FACTOR,
        slope1: marketState.irParams.slope1 / 10 ** IR_PARAMS_SCALING_FACTOR,
        slope2: marketState.irParams.slope2 / 10 ** IR_PARAMS_SCALING_FACTOR,
    };

    const now = Date.now();
    const debtShares = borrower.debtShares / 10 ** marketState.marketAssetParams.decimals;
    const openInterest = marketState.debtParams.openInterest / 10 ** marketState.marketAssetParams.decimals;
    const totalDebtShares = marketState.debtParams.totalDebtShares / 10 ** marketState.marketAssetParams.decimals;
    const totalAssets = marketState.lpParams.totalAssets / 10 ** marketState.marketAssetParams.decimals;
    const timeDelta = Math.ceil(now / 1000) - marketState.accrueInterestParams.lastAccruedBlockTime;

    const debtAssets = convertDebtSharesToAssets(
        debtShares,
        openInterest,
        totalDebtShares,
        totalAssets,
        irParams,
        timeDelta,
    );

    const collaterals = Object.keys(borrower.collateralsDeposited).map(key => {
        const { decimals, liquidationLTV, maxLTV } = marketState.collateralParams[key];
        const price = getCollateralPrice(key, marketState.priceFeed);

        if (!price) {
            throw new Error(`No price found for ${key}`);
        }

        return {
            amount: borrower.collateralsDeposited[key] / 10 ** decimals,
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

    const maxRepayAmount = calculateMaxRepayAmount(
        debtShares,
        openInterest,
        totalDebtShares,
        totalAssets,
        irParams,
        timeDelta
    );


    return {
        health,
        debt: debtAssets,
        collateral: totalCollateralValue,
        risk: liquidationRisk,
        liquidateAmt: maxRepayAmount,
        ltv: debtAssets / totalCollateralValue,
    }
}