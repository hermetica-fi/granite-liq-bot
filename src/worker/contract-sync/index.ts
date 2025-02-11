import { getTransaction } from "granite-liq-bot-common";
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
        
        if (contract.lockTx) {
            const tx = await getTransaction(contract.lockTx, contract.network);
            if (tx.tx_status !== "pending") {
                await dbClient.query("UPDATE contract SET lock_tx = NULL WHERE id = $1", [contract.id]);
                logger.info(`transaction ${contract.lockTx} completed as ${tx.tx_status}`);
                continue;
            }
        }

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