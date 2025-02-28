import type { Transaction } from "@stacks/stacks-blockchain-api-types";
import { getTransaction, type ContractEntity } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { getAssetBalance } from "../../client/read-only-call";
import { pool } from "../../db";
import { getContractList } from "../../dba/contract";
import { createLogger } from "../../logger";
import { epoch } from "../../util";
import { upsertBorrower } from "../db-helper";
import { getLiquidatedPrincipals } from "./lib";

const logger = createLogger("sync-contract");

const handleContractLocks = async (dbClient: PoolClient, contract: ContractEntity) => {

    // schedule contract unlock
    if (contract.lockTx && contract.unlocksAt === null) {
        const tx = await getTransaction(contract.lockTx, contract.network);
        if (tx.tx_status !== "pending") {

            const unlocksAt = epoch() + 60;
            await dbClient.query("UPDATE contract SET unlocks_at = $1 WHERE id = $2", [unlocksAt, contract.id]);
            logger.info(`transaction ${contract.lockTx} completed as ${tx.tx_status}. contract ${contract.id} will be unlocked in 60 seconds`);

            const principals = getLiquidatedPrincipals(tx as Transaction);
            for (const principal of principals) {
                if (await upsertBorrower(dbClient, contract.network, principal) === 2) {
                    logger.info(`Borrower ${principal} check sync activated`);
                }
            }
        }
        return;
    }

    // unlock contract
    if (contract.lockTx && contract.unlocksAt !== null && contract.unlocksAt < epoch()) {
        await dbClient.query("UPDATE contract SET lock_tx = NULL, unlocks_at = NULL WHERE id = $1", [contract.id]);
        logger.info(`contract ${contract.id} unlocked`);
        return;
    }
}

export const worker = async (dbClient: PoolClient) => {
    await dbClient.query("BEGIN");
    const contracts = await getContractList(dbClient);
    for (const contract of contracts) {

        await handleContractLocks(dbClient, contract);

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