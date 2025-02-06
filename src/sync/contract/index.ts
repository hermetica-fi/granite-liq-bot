import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { fetchFn, type NetworkName } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { pool } from "../../db";
import { getContractList } from "../../db-helper";
import { createLogger } from "../../logger";

const logger = createLogger("sync-contract");

const getAssetInfo = async (assetAddress: string, contractId: string, network: NetworkName) => {
    const [contractAddress, contractName] = assetAddress.split(".");
    const name = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-name',
        functionArgs: [],
        senderAddress: contractAddress,
        network: network,
        client: {
            fetch: fetchFn,
        }
    }).then(r => cvToJSON(r).value.value);

    const symbol = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-symbol',
        functionArgs: [],
        senderAddress: contractAddress,
        network: network,
        client: {
            fetch: fetchFn,
        }
    }).then(r => cvToJSON(r).value.value);

    const decimals = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-decimals',
        functionArgs: [],
        senderAddress: contractAddress,
        network: network,
        client: {
            fetch: fetchFn,
        }
    }).then(r => cvToJSON(r).value.value);

    return {
        name, symbol, decimals
    }
}

const getAssetBalance = async (assetAddress: string, contractId: string, network: NetworkName) => {
    const [contractAddress, contractName] = assetAddress.split(".");
    return await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-balance',
        functionArgs: [
            contractPrincipalCV(contractId.split(".")[0], contractId.split(".")[1])
        ],
        senderAddress: contractAddress,
        network: network,
        client: {
            fetch: fetchFn,
        }
    }).then(r => cvToJSON(r).value.value);
}


export const worker = async (dbClient: PoolClient) => {
    await dbClient.query("BEGIN");
    const contracts = await getContractList(dbClient);
    for (const contract of contracts) {

        let marketAsset = contract.marketAsset;
        let collateralAsset = contract.collateralAsset;

        if (!marketAsset || !collateralAsset) {
            const info = await fetchCallReadOnlyFunction({
                contractAddress: contract.address,
                contractName: contract.name,
                functionName: 'get-info',
                functionArgs: [],
                senderAddress: contract.operatorAddress,
                network: contract.network,
                client: {
                    fetch: fetchFn,
                }
            }).then(r => cvToJSON(r));

            if (!marketAsset) {
                const marketAsset = info.value["market-assets"].value;
                const assetInfo = await getAssetInfo(marketAsset, contract.id, contract.network);
                const val = { address: marketAsset, ...assetInfo };
                await dbClient.query("UPDATE contract SET market_asset = $1 WHERE id = $2", [val, contract.id]);
                logger.info(`Market asset updated for ${contract.id} as ${JSON.stringify(val)}`);
            }

            if (!collateralAsset) {
                const collateralAsset = info.value["collateral-assets"].value;
                const assetInfo = await getAssetInfo(collateralAsset, contract.id, contract.network);
                const val = { address: collateralAsset, ...assetInfo };
                await dbClient.query("UPDATE contract SET collateral_asset = $1 WHERE id = $2", [val, contract.id]);
                logger.info(`Collateral asset updated for ${contract.id} as ${JSON.stringify(val)}`);
            }
        }


        const balance1 = await getAssetBalance(marketAsset!.address, contract.id, contract.network);
        await dbClient.query("UPDATE contract SET market_asset_balance = $1 WHERE id = $2", [balance1, contract.id]);

        const balance2 = await getAssetBalance(collateralAsset!.address, contract.id, contract.network);
        await dbClient.query("UPDATE contract SET collateral_asset_balance = $1 WHERE id = $2", [balance2, contract.id])
    }
    await dbClient.query("COMMIT");
};

export const main = async () => {
    let dbClient = await pool.connect();
    await worker(dbClient);
    dbClient.release();
}