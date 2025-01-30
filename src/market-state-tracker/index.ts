import { sleep } from "bun";
import type { PoolClient } from "pg";
import { getPriceFeed } from "../client/pyth";
import { getAccrueInterestParams, getCollateralParams, getDebtParams, getIrParams, getLpParams } from "../client/stacks";
import { PRICE_FEED_IDS } from "../constants";
import { pool } from "../db";
import { getNetworkNameFromAddress } from "../helper";
import { createLogger } from "../logger";
import type { CollateralParams, NetworkName, PriceFeed } from "../types";
import { epoch } from "../util";
import {
    getAccrueInterestParamsLocal, getCollateralParamsLocal, getDebtParamsLocal,
    getDistinctCollateralList, getIrParamsLocal, getLpParamsLocal, setAccrueInterestParamsLocal,
    setCollateralParamsLocal, setDebtParamsLocal, setIrParamsLocal, setLpParamsLocal, setPriceFeedLocal
} from "./shared";

const logger = createLogger("state-tracker");

const syncMarketState = async (dbClient: PoolClient) => {
    const collaterals = await getDistinctCollateralList(dbClient);

    for (const network of ["mainnet", "testnet"] as NetworkName[]) {

        if (!await getIrParamsLocal(dbClient, network)) {
            const val = await getIrParams(network);
            await setIrParamsLocal(dbClient, network, val, epoch() + 60);
            logger.info(`setIrParamsLocal: ${network} ${JSON.stringify(val)}`);
        }

        if (!await getLpParamsLocal(dbClient, network)) {
            const val = await getLpParams(network);
            await setLpParamsLocal(dbClient, network, val, epoch() + 60);
            logger.info(`setLpParamsLocal: ${network} ${JSON.stringify(val)}`);
        }

        if (!await getAccrueInterestParamsLocal(dbClient, network)) {
            const val = await getAccrueInterestParams(network);
            await setAccrueInterestParamsLocal(dbClient, network, val, epoch() + 60);
            logger.info(`setAccrueInterestParamsLocal: ${network} ${JSON.stringify(val)}`);
        }

        if (!await getDebtParamsLocal(dbClient, network)) {
            const val = await getDebtParams(network);
            await setDebtParamsLocal(dbClient, network, val, epoch() + 60);
            logger.info(`setDebtParamsLocal: ${network} ${JSON.stringify(val)}`);
        }

        if (!await getCollateralParamsLocal(dbClient, network)) {
            const collateralParams: Record<string, CollateralParams> = {};
            for (const collateral of collaterals.filter(c => getNetworkNameFromAddress(c) === network)) {
                collateralParams[collateral] = await getCollateralParams(collateral, network);
            }
            await setCollateralParamsLocal(dbClient, network, collateralParams, epoch() + 60);
            logger.info(`setCollateralParamsLocal: ${network} ${JSON.stringify(collateralParams)}`);
        }
    }

    const priceFeed: PriceFeed = {
        btc: await getPriceFeed(PRICE_FEED_IDS.btc),
        eth: await getPriceFeed(PRICE_FEED_IDS.eth),
        usdc: await getPriceFeed(PRICE_FEED_IDS.usdc),
    }

    await setPriceFeedLocal(dbClient, priceFeed, epoch() + 10);
    logger.info(`setPriceFeedLocal: ${JSON.stringify(priceFeed)}`);
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
    await sleep(1000);

    while (true) {
        await worker();
        await sleep(1000);
    }
};