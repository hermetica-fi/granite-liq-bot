import { sleep } from "bun";
import { cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { CONTRACTS, PRICE_FEED_IDS } from "../constants";
import { getNetworkNameFromAddress } from "../helper";
import type { AccrueInterestParams, DebtParams, InterestRateParams, LpParams, MarketState, NetworkName, PriceFeed } from "../types";
import type { PoolClient } from "pg";
import { kvStoreSet } from "../db/helper";
import { pool } from "../db";
import { createLogger } from "../logger";
import { setMarketState } from "./lib";

const logger = createLogger("state-tracker");

const getIrParams = async (contract: string, network: NetworkName): Promise<InterestRateParams> => {
    const [contractAddress, contractName] = contract.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-ir-params",
        functionArgs: [],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);
        return {
            baseIR: Number(json.value["base-ir"].value),
            slope1: Number(json.value["ir-slope-1"].value),
            slope2: Number(json.value["ir-slope-2"].value),
            urKink: Number(json.value["utilization-kink"].value),
        }
    })
}

const getLpParams = async (contract: string, network: NetworkName): Promise<LpParams> => {
    const [contractAddress, contractName] = contract.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-lp-params",
        functionArgs: [],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);
        return {
            totalAssets: Number(json.value["total-assets"].value),
            totalShares: Number(json.value["total-shares"].value),
        }
    })
};

const getDebtParams = async (contract: string, network: NetworkName): Promise<DebtParams> => {
    const [contractAddress, contractName] = contract.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-debt-params",
        functionArgs: [],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);

        return {
            openInterest: Number(json.value["open-interest"].value),
            totalDebtShares: Number(json.value["total-debt-shares"].value),
        }
    })
};

const getAccrueInterestParams = async (contract: string, network: NetworkName): Promise<AccrueInterestParams> => {
    const [contractAddress, contractName] = contract.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-accrue-interest-params",
        functionArgs: [],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);

        return {
            lastAccruedBlockTime: Number(json.value.value["last-accrued-block-time"].value)
        }
    })
}


const getPriceFeed = async (feedId: string): Promise<any> => {
    return fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`).then(r => r.json()).then(r => Number(r.parsed[0].price.price))
}



const syncMarketState = async (dbClient: PoolClient) => {
    for (const network of ["mainnet", "testnet"] as NetworkName[]) {
        const irParams = await getIrParams(CONTRACTS[network].ir, network);
        const lpParams = await getLpParams(CONTRACTS[network].state, network);
        const accrueInterestParams = await getAccrueInterestParams(CONTRACTS[network].state, network);
        const debtParams = await getDebtParams(CONTRACTS[network].state, network);
        const priceFeed: PriceFeed = {
            btc: await getPriceFeed(PRICE_FEED_IDS.btc),
            eth: await getPriceFeed(PRICE_FEED_IDS.eth),
            usdc: await getPriceFeed(PRICE_FEED_IDS.usdc),
        }

        const marketState: MarketState = {
            irParams,
            lpParams,
            accrueInterestParams,
            debtParams,
            priceFeed
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
    await sleep(5000);

    while (true) {
        await worker();
        await sleep(5000);
    }
};