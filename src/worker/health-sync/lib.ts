import type { BorrowerStatus } from "granite-liq-bot-common";
import {
    calculateAccountHealth, calculateAccountLiqLTV,
    calculateLiquidationPoint, calculateMaxRepayAmount, calculateTotalCollateralValue, convertDebtSharesToAssets, liquidatorMaxRepayAmount
} from "granite-math-sdk";
import type { PriceFeedResponse } from "../../client/pyth";
import { IR_PARAMS_SCALING_FACTOR, LIQUIDATION_PREMIUM } from "../../constants";
import { toTicker } from "../../helper";
import type { InterestRateParams, MarketState } from "../../types";

export const calcBorrowerStatus = (borrower: {
    debtShares: number;
    collateralsDeposited: Record<string, number>;
}, marketState: MarketState, priceFeed: PriceFeedResponse): BorrowerStatus => {
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
        const { liquidationLTV, maxLTV } = marketState.collateralParams[key];
        const feed = priceFeed.items[toTicker(key)];

        if (!feed) {
            throw new Error(`No price feed found for ${key}`);
        }

        const price = Number(feed.price.price);
        const decimals = -1 * feed.price.expo

        return {
            id: key,
            amount: borrower.collateralsDeposited[key] / 10 ** decimals,
            price: price / 10 ** decimals,
            liquidationLTV: liquidationLTV / 10 ** decimals,
            maxLTV: maxLTV / 10 ** decimals,
            liquidationPremium: LIQUIDATION_PREMIUM,
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

    const maxRepay: Record<string, number> = {};
    let totalRepayAmount = 0;

    if (liquidationRisk >= 1) {
        for (const collateral of collaterals) {
            const marketValueAvailableToLiquidate = liquidatorMaxRepayAmount(
                debtShares,
                openInterest,
                totalDebtShares,
                totalAssets,
                irParams,
                timeDelta,
                collateral
            );

            maxRepay[collateral.id] = marketValueAvailableToLiquidate;
            totalRepayAmount += marketValueAvailableToLiquidate;
        }
    }

    return {
        health,
        debt: debtAssets,
        collateral: totalCollateralValue,
        risk: liquidationRisk,
        maxRepay,
        totalRepayAmount,
        ltv: debtAssets / totalCollateralValue,
    }
}