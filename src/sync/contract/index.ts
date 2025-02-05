import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { fetchFn, type NetworkName } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { pool } from "../../db";
import { createLogger } from "../../logger";
import { clearBorrowerStatuses } from "../db-helper";

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
    const balance = await fetchCallReadOnlyFunction({
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
    await clearBorrowerStatuses(dbClient);
    const contracts = await dbClient.query("SELECT id, address, name, network, operator_address, market_asset, collateral_asset FROM contract");
    for (const contract of contracts.rows) {

        const info = await fetchCallReadOnlyFunction({
            contractAddress: contract.address,
            contractName: contract.name,
            functionName: 'get-info',
            functionArgs: [],
            senderAddress: contract.operator_address,
            network: contract.network,
            client: {
                fetch: fetchFn,
            }
        }).then(r => cvToJSON(r));

        const marketAsset = info.value["market-assets"].value.map((x: { value: string }) => x.value)[0] as string || null;
        if (!marketAsset && contract.market_asset) {
            await dbClient.query("UPDATE contract SET market_asset = NULL WHERE id = $1", [contract.id]);
            logger.info(`Market asset reset for ${contract.id}`);
        } else if (marketAsset && marketAsset !== contract.market_asset?.address) {
            let assetInfo = await getAssetInfo(marketAsset, contract.id, contract.network);
            const val = { address: marketAsset, ...assetInfo };
            await dbClient.query("UPDATE contract SET market_asset = $1 WHERE id = $2", [val, contract.id]);
            logger.info(`Market asset updated for ${contract.id} as ${JSON.stringify(val)}`);
        }

        if(marketAsset) {
            const balance = await getAssetBalance(marketAsset, contract.id, contract.network);
            await dbClient.query("UPDATE contract SET market_asset_balance = $1 WHERE id = $2", [balance, contract.id]);
        } else {
            await dbClient.query("UPDATE contract SET market_asset_balance = 0 WHERE id = $1", [contract.id]);
        }


        const collateralAsset = info.value["collateral-assets"].value.map((x: { value: string }) => x.value)[0] as string || null;
        if (!collateralAsset && contract.collateral_asset) {
            await dbClient.query("UPDATE contract SET collateral_asset = NULL WHERE id = $1", [contract.id]);
            logger.info(`Collateral asset reset for ${contract.id}`);
        } else if (collateralAsset && collateralAsset !== contract.collateral_asset?.address) {
            let assetInfo = await getAssetInfo(collateralAsset, contract.id, contract.network);
            const val = { address: collateralAsset, ...assetInfo };
            await dbClient.query("UPDATE contract SET collateral_asset = $1 WHERE id = $2", [val, contract.id]);
            logger.info(`Collateral asset updated for ${contract.id} as ${JSON.stringify(val)}`);
        }

        if(collateralAsset) {
            const balance = await getAssetBalance(collateralAsset, contract.id, contract.network);
            await dbClient.query("UPDATE contract SET collateral_asset_balance = $1 WHERE id = $2", [balance, contract.id]);
        } else {
            await dbClient.query("UPDATE contract SET collateral_asset_balance = 0 WHERE id = $1", [contract.id]);
        }
    }
    await dbClient.query("COMMIT");
};

export const main = async () => {
    let dbClient = await pool.connect();
    await worker(dbClient);
    dbClient.release();
}