import { sleep } from "bun";
import { cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { CONTRACTS } from "../constants";
import { getNetworkNameFromAddress } from "../helper";
import type { NetworkName } from "../types";
import type { PoolClient } from "pg";
import { kvStoreSet } from "../db/helper";
import { pool } from "../db";
import { createLogger } from "../logger";

const logger = createLogger("state-tracker");

const getIrParams = async (contract: string, network: NetworkName) => {
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
            ["base-ir"]: json.value["base-ir"].value,
            ["ir-slope-1"]: json.value["ir-slope-1"].value,
            ["ir-slope-2"]: json.value["ir-slope-2"].value,
            ["utilization-kink"]: json.value["utilization-kink"].value,
        }
    })
}

const getLpParams = async (contract: string, network: NetworkName) => {
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
            ["total-assets"]: json.value["total-assets"].value,
            ["total-shares"]: json.value["total-shares"].value,
        }
    })
};

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
}

const worker = async () => {
    let dbClient = await pool.connect();
    await dbClient.query("BEGIN");
    await syncMarketState(dbClient);
    await dbClient.query("COMMIT");
}

export const main = async () => {
    await worker();

    while (true) {
        await worker();
        await sleep(10000);
    }

};

main();