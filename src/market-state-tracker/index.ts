import { sleep } from "bun";
import type { PoolClient } from "pg";
import { getPriceFeed } from "../client/pyth";
import { getAccrueInterestParams, getCollateralParams, getDebtParams, getIrParams, getLpParams } from "../client/stacks";
import { PRICE_FEED_IDS } from "../constants";
import { pool } from "../db";
import { getNetworkNameFromAddress } from "../helper";
import { createLogger } from "../logger";
import type { CollateralParams, MarketState, NetworkName, PriceFeed } from "../types";
import { getDistinctCollateralList, setMarketState } from "./lib";

const logger = createLogger("state-tracker");

const syncMarketState = async (dbClient: PoolClient) => {
    const collaterals = await getDistinctCollateralList(dbClient);

    for (const network of ["mainnet", "testnet"] as NetworkName[]) {
        const irParams = await getIrParams(network);
        const lpParams = await getLpParams(network);
        const accrueInterestParams = await getAccrueInterestParams(network);
        const debtParams = await getDebtParams(network);
        const priceFeed: PriceFeed = {
            btc: await getPriceFeed(PRICE_FEED_IDS.btc),
            eth: await getPriceFeed(PRICE_FEED_IDS.eth),
            usdc: await getPriceFeed(PRICE_FEED_IDS.usdc),
        }

        const collateralParams: Record<string, CollateralParams> = {};
        for (const collateral of collaterals.filter(c => getNetworkNameFromAddress(c) === network)) {
            collateralParams[collateral] = await getCollateralParams(collateral, network);
        }

        const marketState: MarketState = {
            irParams,
            lpParams,
            accrueInterestParams,
            debtParams,
            priceFeed,
            collateralParams
        }

        await setMarketState(dbClient, network, marketState);
    }
}

const worker = async () => {
    let dbClient = await pool.connect();
    await dbClient.query("BEGIN");
    await syncMarketState(dbClient);
    await dbClient.query("COMMIT");
    dbClient.release();
}

export const main = async () => {
    await worker();
    await sleep(10000);

    while (true) {
        await worker();
        await sleep(10000);
    }
};