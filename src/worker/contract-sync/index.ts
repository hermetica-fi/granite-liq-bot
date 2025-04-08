import type { Transaction } from "@stacks/stacks-blockchain-api-types";
import { getAccountBalances, getTransaction } from "../../client/hiro";
import { getAssetBalance } from "../../client/read-only-call";
import { ALERT_BALANCE } from "../../constants";
import { upsertBorrower } from "../../dba/borrower";
import { getContractList, unlockContract, unlockContractSchedule, updateContractBalances } from "../../dba/contract";
import { finalizeLiquidation } from "../../dba/liquidation";
import { onLiqTxEnd, onLowFunds } from "../../hooks";
import { createLogger } from "../../logger";
import { type ContractEntity } from "../../types";
import { formatUnits } from "../../units";
import { epoch } from "../../util";
import { getLiquidatedPrincipals } from "./lib";

const logger = createLogger("sync-contract");

const handleContractLocks = async (contract: ContractEntity) => {

    if (contract.lockTx && contract.unlocksAt === null) {
        const tx = await getTransaction(contract.lockTx, 'mainnet');
        if (tx.tx_status && tx.tx_status !== "pending") {
            // schedule unlock
            unlockContractSchedule(epoch() + 60, contract.id);
            logger.info(`transaction ${contract.lockTx} completed as ${tx.tx_status}. contract ${contract.id} will be unlocked in 60 seconds`);

            // finalize liquidation
            finalizeLiquidation(contract.lockTx, tx.tx_status);

            // export affected principals from the transaction and activate sync
            const principals = getLiquidatedPrincipals(tx as Transaction);
            for (const principal of principals) {
                if (upsertBorrower(principal) === 2) {
                    logger.info(`Borrower ${principal} check sync activated`);
                }
            }

            await onLiqTxEnd(contract.lockTx, tx.tx_status);
        }
        return;
    }

    // unlock contract
    if (contract.lockTx && contract.unlocksAt !== null && contract.unlocksAt < epoch()) {
        unlockContract(contract.id);
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

        updateContractBalances(oBalance, mBalance, cBalance, contract.id);

        if (Number(oBalance) <= ALERT_BALANCE) {
            const strObalance = formatUnits(Number(oBalance), 6);
            logger.error(`Operator balance is low: ${strObalance} STX`)
            await onLowFunds(`${strObalance} STX`);
        }
    }
};

export const main = async () => {
    await worker();
}