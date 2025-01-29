import { sleep } from "bun";
import { cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { CONTRACTS } from "../constants";
import { getNetworkNameFromAddress } from "../helper";
import type { AccrueInterestParams, InterestRateParams, LpParams, NetworkName } from "../types";
import type { PoolClient } from "pg";
import { kvStoreSet } from "../db/helper";
import { pool } from "../db";
import { createLogger } from "../logger";

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

const syncMarketState = async (dbClient: PoolClient) => {
    for (const contract of [CONTRACTS.mainnet.ir, CONTRACTS.testnet.ir]) {
        const network = getNetworkNameFromAddress(contract);
        const params = await getIrParams(contract, network);
        await kvStoreSet(dbClient, `ir-params-${network}`, JSON.stringify(params));
    }

    for (const contract of [CONTRACTS.mainnet.state, CONTRACTS.testnet.state]) {
        const network = getNetworkNameFromAddress(contract);
        const params = await getLpParams(contract, network);
        await kvStoreSet(dbClient, `lp-params-${network}`, JSON.stringify(params));
    }

    for (const contract of [CONTRACTS.mainnet.state, CONTRACTS.testnet.state]) {
        const network = getNetworkNameFromAddress(contract);
        const params = await getAccrueInterestParams(contract, network);
        await kvStoreSet(dbClient, `accrue-interest-params-${network}`, JSON.stringify(params));
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

    while (true) {
        await worker();
        await sleep(10000);
    }
};