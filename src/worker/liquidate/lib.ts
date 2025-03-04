import { listCV, noneCV, principalCV, someCV, tupleCV, uintCV, type ClarityValue } from "@stacks/transactions";
import { parseUnits, toFixedDown, type AssetInfoWithBalance, type BorrowerStatusEntity } from "granite-liq-bot-common";
import type { SwapResult } from "../../alex";
import type { PriceFeedResponse } from "../../client/pyth";
import { MIN_TO_LIQUIDATE_PER_USER } from "../../constants";
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

export const calcCollateralToGive = (repayAmount: bigint, liquidationDiscount: bigint, collateralPrice: bigint, collateralDecimals: bigint, marketTokenDecimals: bigint) => {

    const SCALING_FACTOR = 100000000n;

    const safeDiv = (x: bigint, y: bigint) => {
        if (y > 0n) {
            return x / y;
        }

        throw new Error("ERR-DIVIDE-BY-ZERO");
    }

    const toFixed = (a: bigint, decimalsA: bigint, fixedPrecision: bigint) => {
        if (decimalsA > fixedPrecision) {
            return a / (10n ** (decimalsA - fixedPrecision));
        } else {
            return a * (10n ** (fixedPrecision - decimalsA));
        }

    }

    const repayAmountWithDiscount = repayAmount * (SCALING_FACTOR + liquidationDiscount) / SCALING_FACTOR;
    const collateralAmount = safeDiv(repayAmountWithDiscount * SCALING_FACTOR, collateralPrice);
    const decimalCorrectedCollateral = toFixed(collateralAmount, marketTokenDecimals, collateralDecimals);

    return decimalCorrectedCollateral;
}

export const makeLiquidationBatch = (marketAssetInfo: AssetInfoWithBalance, collateralAssetInfo: AssetInfoWithBalance, borrowers: BorrowerStatusEntity[], priceFeed: PriceFeedResponse, liquidationPremium: number): LiquidationBatch[] => {
    const cTicker = toTicker(collateralAssetInfo.symbol);
    const cFeed = priceFeed.items[cTicker];

    if (!cFeed) {
        throw new Error("Collateral asset price feed not found");
    }

    const collateralPrice = Number(cFeed.price.price)

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

        if (repayAmount < MIN_TO_LIQUIDATE_PER_USER) {
            continue;
        }

        const repayAmountAdjusted = toFixedDown(repayAmount, 3); // toFixedDown(repayAmount - (repayAmount / 100 * REPAY_ADJUSTMENT), 3);
        const repayAmountAdjustedBn = parseUnits(repayAmountAdjusted, marketAssetInfo.decimals);
        const repayAmountFinalBn = Math.min(availableBn, repayAmountAdjustedBn);

        availableBn = availableBn - repayAmountFinalBn;

        const minCollateralExpected = calcCollateralToGive(BigInt(repayAmountFinalBn), BigInt(liquidationPremium), BigInt(collateralPrice), BigInt(collateralAssetInfo.decimals), BigInt(marketAssetInfo.decimals));

        batch.push({
            user: borrower.address,
            liquidatorRepayAmount: repayAmountFinalBn,
            minCollateralExpected: Number(minCollateralExpected)
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


