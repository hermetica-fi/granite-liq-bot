import { bufferCV, Cl, intCV, listCV, principalCV, serializeCVBytes, someCV, tupleCV, uintCV } from "@stacks/transactions";
import { formatUnits, parseUnits, type AssetInfo } from "granite-liq-bot-common";
import type { BorrowerStatusEntity } from "../../common/types";
import type { PriceFeedResponse } from "../client/pyth";
import { toTicker } from "../helper";
import type { LiquidationBatch } from "../types";

export const priceFeedCv = (priceFeed: PriceFeedResponse) => {
    const keys = Object.keys(priceFeed.items);
    const listItems = keys.map(key => {
        const item = priceFeed.items[key];

        return tupleCV({
            "price-identifier": Cl.bufferFromHex(item.id),
            "price": intCV(item.price.price),
            "conf": uintCV(item.price.conf),
            "expo": intCV(item.price.expo),
            "ema-price": intCV(item.ema_price.price),
            "ema-conf": uintCV(item.ema_price.conf),
            "publish-time": uintCV(item.price.publish_time),
            "prev-publish-time": uintCV(item.metadata.prev_publish_time)
        });
    });

    return someCV(bufferCV(serializeCVBytes(listCV(listItems))));
}

export const liquidationBatchCv = (batch: LiquidationBatch[]) => {
    const listItems = batch.map(b => someCV(
        tupleCV({
            "user": principalCV(b.user),
            "liquidator-repay-amount": uintCV(b.liquidatorRepayAmount),
            "min-collateral-expected": uintCV(b.minCollateralExpected)
        })));

    return listCV(listItems)
}


export const makeLiquidationBatch = (marketAssetInfo: AssetInfo, collateralAssetInfo: AssetInfo, borrowers: BorrowerStatusEntity[], priceFeed: PriceFeedResponse): LiquidationBatch[] => {
    const cTicker = toTicker(collateralAssetInfo.symbol);
    const cFeed = priceFeed.items[cTicker];

    if (!cFeed) {
        throw new Error("Collateral asset price feed not found");
    }

    const collateralPrice = formatUnits(Number(cFeed.price.price), -1 * cFeed.price.expo);
    const collateralPriceBn = parseUnits(collateralPrice, collateralAssetInfo.decimals);

    const batch: LiquidationBatch[] = [];

    let availableBn = marketAssetInfo.balance;

    for (const borrower of borrowers) {
        if (availableBn <= 0) {
            break;
        }

        const repayAmount = borrower.maxRepayAmount;
        // Adjust down max repay amount to prevent transaction failure in case volatility 
        // + removes decimals to protects from decimal precision issues (TODO: Not great solution, improve)
        const repayAmountAdjusted = Number((repayAmount * 0.9999).toFixed(0))
        const repayAmountAdjustedBn = parseUnits(repayAmountAdjusted, marketAssetInfo.decimals);
        const repayAmountFinalBn = Math.min(availableBn, repayAmountAdjustedBn);

        availableBn = availableBn - repayAmountFinalBn;

        const minCollateralExpected = Number((repayAmountFinalBn / collateralPriceBn).toFixed(collateralAssetInfo.decimals));
        const minCollateralExpectedBn = Math.floor(parseUnits(minCollateralExpected, collateralAssetInfo.decimals));

        batch.push({
            user: borrower.address,
            liquidatorRepayAmount: repayAmountFinalBn,
            minCollateralExpected: minCollateralExpectedBn
        })

        /*
        console.log("maxRepayAmount           ", repayAmount);
        console.log("maxRepayAmountAdjusted   ", repayAmountAdjusted);
        console.log("maxRepayAmountAdjustedBn ", repayAmountAdjustedBn);
        console.log("repayAmountFinalBn       ", repayAmountFinalBn);
        console.log("minCollateralExpected    ", minCollateralExpected);
        console.log("minCollateralExpectedBn  ", minCollateralExpectedBn)
        */
    }

    return batch;
}