import { listCV, noneCV, principalCV, someCV, tupleCV, uintCV, type ClarityValue } from "@stacks/transactions";
import { formatUnits, parseUnits, type AssetInfo, type BorrowerStatusEntity } from "granite-liq-bot-common";
import type { SwapResult } from "../../alex";
import type { PriceFeedResponse } from "../../client/pyth";
import { REPAY_ADJUSTMENT } from "../../constants";
import { toTicker } from "../../helper";
import type { LiquidationBatch } from "../../types";


export const liquidationBatchCv = (batch: LiquidationBatch[]) => {
    const listItems = batch.map(b => someCV(
        tupleCV({
            "user": principalCV(b.user),
            "liquidator-repay-amount": uintCV(b.liquidatorRepayAmount),
            "min-collateral-expected": uintCV(b.minCollateralExpected)
        })));

    return listCV(listItems)
}

// to fixed precision without rounding
const toFixed = (value: number, precision: number) => {
    const s = value.toString();
    const [integer, decimal] = s.split('.');
    return Number(`${integer}.${decimal.slice(0, precision)}`);
}

export const makeLiquidationBatch = (marketAssetInfo: AssetInfo, collateralAssetInfo: AssetInfo, borrowers: BorrowerStatusEntity[], priceFeed: PriceFeedResponse): LiquidationBatch[] => {
    const cTicker = toTicker(collateralAssetInfo.symbol);
    const cFeed = priceFeed.items[cTicker];

    if (!cFeed) {
        throw new Error("Collateral asset price feed not found");
    }

    const collateralPrice = formatUnits(Number(cFeed.price.price), -1 * cFeed.price.expo);

    const batch: LiquidationBatch[] = [];

    let availableBn = marketAssetInfo.balance;

    for (const borrower of borrowers) {
        if (availableBn <= 0) {
            break;
        }

        const repayAmount = borrower.maxRepay[collateralAssetInfo.address];
        if (!repayAmount) {
            continue;
        }

        // Adjust down max repay amount %5 to prevent transaction failure in case volatility 
        // + removes decimals to protects from decimal precision issues (TODO: Not great solution, needs improvements)
        const repayAmountAdjusted = toFixed(repayAmount - (repayAmount / 100 * REPAY_ADJUSTMENT), 2);
        const repayAmountAdjustedBn = parseUnits(repayAmountAdjusted, marketAssetInfo.decimals);
        const repayAmountFinalBn = Math.min(availableBn, repayAmountAdjustedBn);
        const repayAmountFinal = formatUnits(repayAmountFinalBn, marketAssetInfo.decimals);

        availableBn = availableBn - repayAmountFinalBn;

        const minCollateralExpected = toFixed((repayAmountFinal / collateralPrice), collateralAssetInfo.decimals);
        const minCollateralExpectedBn = Math.floor(parseUnits(minCollateralExpected, collateralAssetInfo.decimals));

        batch.push({
            user: borrower.address,
            liquidatorRepayAmount: repayAmountFinalBn,
            minCollateralExpected: minCollateralExpectedBn,
            details: {
                repayAmount,
                repayAmountAdjusted,
                repayAmountAdjustedBn,
                repayAmountFinalBn,
                repayAmountFinal,
                collateralPrice,
                minCollateralExpected,
                minCollateralExpectedBn
            }
        });
    }

    return batch;
}

export const swapOutCv = (swap: SwapResult) => {
    const swapData: Record<string, ClarityValue> = {};

    const lettersP = ['x', 'y', 'z', 'w', 'v'];
    for (let i = 0; i < lettersP.length; i++) {
        const l = lettersP[i];
        if (swap.option.path[i]) {
            swapData[`token-${l}`] = i > 1 ? someCV(swap.option.path[i]) : swap.option.path[i];
        } else {
            swapData[`token-${l}`] = noneCV();
        }
    }

    const lettersF = ['x', 'y', 'z', 'w'];
    for (let i = 0; i < lettersF.length; i++) {
        const l = lettersF[i];
        if (swap.option.factors[i]) {
            swapData[`factor-${l}`] = i > 0 ? someCV(swap.option.factors[i]) : swap.option.factors[i];
        } else {
            swapData[`factor-${l}`] = noneCV();
        }
    }

    return someCV(tupleCV(swapData));
}