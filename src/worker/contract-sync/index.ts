import type { PoolClient } from "pg";
import { getAssetBalance } from "../../client/read-only-call";
import { pool } from "../../db";
import { getContractList } from "../../db-helper";
import { createLogger } from "../../logger";

const logger = createLogger("sync-contract");

export const worker = async (dbClient: PoolClient) => {
    await dbClient.query("BEGIN");
    const contracts = await getContractList(dbClient);
    for (const contract of contracts) {
        const balance1 = await getAssetBalance(contract.marketAsset!.address, contract.id, contract.network);
        await dbClient.query("UPDATE contract SET market_asset_balance = $1 WHERE id = $2", [balance1, contract.id]);

        const balance2 = await getAssetBalance(contract.collateralAsset!.address, contract.id, contract.network);
        await dbClient.query("UPDATE contract SET collateral_asset_balance = $1 WHERE id = $2", [balance2, contract.id])
    }
    await dbClient.query("COMMIT");
};

export const main = async () => {
    let dbClient = await pool.connect();
    await worker(dbClient);
    dbClient.release();
}