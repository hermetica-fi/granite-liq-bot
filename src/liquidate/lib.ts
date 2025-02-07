import { bufferCV, Cl, intCV, listCV, principalCV, serializeCVBytes, someCV, tupleCV, uintCV } from "@stacks/transactions";
import type { PriceFeedResponse } from "../client/pyth";
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