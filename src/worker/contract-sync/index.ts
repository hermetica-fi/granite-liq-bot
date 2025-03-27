import type { Transaction } from "@stacks/stacks-blockchain-api-types";
import { getAccountBalances, getTransaction, type ContractEntity } from "granite-liq-bot-common";
import { getAssetBalance } from "../../client/read-only-call";
import { dbCon } from "../../db/con";
import { upsertBorrower } from "../../dba/borrower";
import { getContractList } from "../../dba/contract";
import { finalizeLiquidation } from "../../dba/liquidation";
import { createLogger } from "../../logger";
import { epoch } from "../../util";
import { getLiquidatedPrincipals } from "./lib";

const logger = createLogger("sync-contract");

const handleContractLocks = async (contract: ContractEntity) => {

    // schedule contract unlock
    if (contract.lockTx && contract.unlocksAt === null) {
        const tx = await getTransaction(contract.lockTx, 'mainnet');
        if (tx.tx_status && tx.tx_status !== "pending") {

            const unlocksAt = epoch() + 60;
            dbCon.run("UPDATE contract SET unlocks_at = $1 WHERE id = $2", [unlocksAt, contract.id]);
            finalizeLiquidation(contract.lockTx, tx.tx_status);
            logger.info(`transaction ${contract.lockTx} completed as ${tx.tx_status}. contract ${contract.id} will be unlocked in 60 seconds`);

            const principals = getLiquidatedPrincipals(tx as Transaction);
            for (const principal of principals) {
                if (upsertBorrower(principal) === 2) {
                    logger.info(`Borrower ${principal} check sync activated`);
                }
            }
        }
        return;
    }

    // unlock contract
    if (contract.lockTx && contract.unlocksAt !== null && contract.unlocksAt < epoch()) {
        dbCon.run("UPDATE contract SET lock_tx = NULL, unlocks_at = NULL WHERE id = $1", [contract.id]);
        logger.info(`contract ${contract.id} unlocked`);
        return;
    }
}

export const worker = async () => {
    const contracts = getContractList({});
    for (const contract of contracts) {
        await handleContractLocks(contract);

        const oBalance = (await getAccountBalances(contract.operatorAddress, "mainnet")).stx.balance;
        const mBalance = await getAssetBalance(contract.marketAsset!.address, contract.id);
        const cBalance = await getAssetBalance(contract.collateralAsset!.address, contract.id);

        dbCon.run("UPDATE contract SET operator_balance = ?, market_asset_balance = ?, collateral_asset_balance = ? WHERE id = ?", [oBalance, mBalance, cBalance, contract.id])
    }
};

export const main = async () => {
    await worker();
}