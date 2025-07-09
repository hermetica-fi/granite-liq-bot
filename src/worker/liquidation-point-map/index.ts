import assert from "assert";
import { config } from "granite-config";
import { fetchAndProcessPriceFeed } from "../../client/pyth";
import { USE_STAGING } from "../../constants";
import { getBorrowerCollateralAmount, getBorrowersForHealthCheck } from "../../dba/borrower";
import { getMarketState } from "../../dba/market";
import { toTicker } from "../../helper";
import { calcBorrowerStatus } from "../health-sync/lib";
import { generateDescendingPriceBuckets } from "./lib";

const market = USE_STAGING ? config.markets.MAINNET_STAGING : config.markets.MAINNET;

export const worker = async () => {
    const priceFeed = await fetchAndProcessPriceFeed();
    const marketState = getMarketState();
    const borrowers = getBorrowersForHealthCheck();

    const heatmap: Record<string, { liquidationPriceUSD: number, liquidatedAmountUSD: number }[]> = {}

    for (let coll of market.collaterals) {
        const collateral = `${coll.contract.principal}.${coll.contract.name}`;
        const ticker = toTicker(collateral);
        const feed = priceFeed.items[ticker];
        if (!feed) {
            throw new Error(`No price feed found for ${collateral}`);
        }
        const price = Number(feed.price.price);
        const decimals = -1 * feed.price.expo;
        const buckets = generateDescendingPriceBuckets(price, 100, 200, decimals);
        const data: { liquidationPriceUSD: number, liquidatedAmountUSD: number }[] = [];

        for (let bucket of buckets) {
            let liquidatedAmountUSD = 0;

            for (const borrower of borrowers) {
                if (borrower.debtShares === 0) {
                    continue;
                }
                const amount = getBorrowerCollateralAmount(borrower.address, collateral);
                assert(amount !== undefined, "User collateral amount is undefined");
                const collateralsDeposited = {
                    [collateral]:
                    {
                        amount, price: bucket, decimals
                    }
                };

                const status = calcBorrowerStatus({
                    debtShares: borrower.debtShares,
                    collateralsDeposited
                }, marketState);

                liquidatedAmountUSD += status.totalRepayAmount;
            }
            data.push({ liquidationPriceUSD: bucket / 10 ** decimals, liquidatedAmountUSD });
        }

        heatmap[ticker] = data;
    }

    console.log(heatmap["btc"][heatmap["btc"].length - 1])
};

export const main = async () => {
    await worker();
}

main()


