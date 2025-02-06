import { cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { fetchFn } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { getAssetBalance, getAssetInfo } from "../../client/read-only-call";
import { pool } from "../../db";
import { getContractList } from "../../db-helper";
import { createLogger } from "../../logger";

const logger = createLogger("sync-contract");



export const worker = async (dbClient: PoolClient) => {
    await dbClient.query("BEGIN");
    const contracts = await getContractList(dbClient);
    for (const contract of contracts) {

        let marketAsset = contract.marketAsset?.address;
        let collateralAsset = contract.collateralAsset?.address;

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
                marketAsset = info.value["market-asset"].value;
                const assetInfo = await getAssetInfo(marketAsset!, contract.network);
                const val = { address: marketAsset, ...assetInfo };
                await dbClient.query("UPDATE contract SET market_asset = $1 WHERE id = $2", [val, contract.id]);
                logger.info(`Market asset updated for ${contract.id} as ${JSON.stringify(val)}`);
            }

            if (!collateralAsset) {
                collateralAsset = info.value["collateral-asset"].value;
                const assetInfo = await getAssetInfo(collateralAsset!, contract.network);
                const val = { address: collateralAsset, ...assetInfo };
                await dbClient.query("UPDATE contract SET collateral_asset = $1 WHERE id = $2", [val, contract.id]);
                logger.info(`Collateral asset updated for ${contract.id} as ${JSON.stringify(val)}`);
            }
        }


        const balance1 = await getAssetBalance(marketAsset!, contract.id, contract.network);
        await dbClient.query("UPDATE contract SET market_asset_balance = $1 WHERE id = $2", [balance1, contract.id]);

        const balance2 = await getAssetBalance(collateralAsset!, contract.id, contract.network);
        await dbClient.query("UPDATE contract SET collateral_asset_balance = $1 WHERE id = $2", [balance2, contract.id])
    }
    await dbClient.query("COMMIT");
};

export const main = async () => {
    let dbClient = await pool.connect();
    await worker(dbClient);
    dbClient.release();
}