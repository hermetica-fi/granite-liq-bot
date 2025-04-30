import { listCV, principalCV, someCV, tupleCV, uintCV } from "@stacks/transactions";
import { MIN_TO_LIQUIDATE_PER_USER } from "../../constants";
import type { LiquidationBatch } from "../../types";
import { type AssetInfoWithBalance, type BorrowerStatusEntity } from "../../types";
import { parseUnits, toFixedDown } from "../../units";


export const liquidationBatchCv = (batch: LiquidationBatch[]) => {
    const listItems = batch.map(b => someCV(tupleCV({
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

export const makeLiquidationBatch = (marketAssetInfo: AssetInfoWithBalance, collateralAssetInfo: AssetInfoWithBalance, flashLoanCapacity: number, borrowers: BorrowerStatusEntity[], collateralPrice: number, liquidationPremium: number): LiquidationBatch[] => {
    const batch: LiquidationBatch[] = [];

    let availableBn = marketAssetInfo.balance + flashLoanCapacity;

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

        const repayAmountAdjusted = toFixedDown(repayAmount, 3);
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

export const calcMinOut = (paid: number, unprofitabilityThreshold: number) => {
    const SCALING_FACTOR = 10000n;

    return Number(BigInt(paid) - ((BigInt(paid) * BigInt(unprofitabilityThreshold)) / SCALING_FACTOR));
}

