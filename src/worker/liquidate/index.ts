import { broadcastTransaction, bufferCV, contractPrincipalCV, makeContractCall, noneCV, PostConditionMode, someCV, uintCV, type ClarityValue } from "@stacks/transactions";
import { estimateTxFeeOptimistic, fetchFn, formatUnits, getAccountNonces, type NetworkName } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { getBestSwap } from "../../alex";
import { fetchAndProcessPriceFeed } from "../../client/pyth";
import { MIN_TO_LIQUIDATE, TX_TIMEOUT } from "../../constants";
import { pool } from "../../db";
import { getBorrowerStatusList, getContractList } from "../../db-helper";
import { hexToUint8Array } from "../../helper";
import { createLogger } from "../../logger";
import { epoch } from "../../util";
import { getBorrowersToSync } from "../db-helper";
import { liquidationBatchCv, makeLiquidationBatch, swapOutCv } from "./lib";

const logger = createLogger("liquidate");

const worker = async (dbClient: PoolClient, network: NetworkName) => {
    const contract = (await getContractList(dbClient, {
        filters: {
            network,
        },
        orderBy: 'market_asset_balance DESC'
    }))[0];

    if (!contract) {
        // logger.info(`No ${network} contract found`);
        return;
    }

    if (contract.lockTx) {
        // logger.info("Contract is locked, skipping");
        return;
    }

    if ((await getBorrowersToSync(dbClient)).length > 0) {
        // logger.info("Borrowers to sync found, skipping");
        return;
    }

    const { marketAsset, collateralAsset } = contract;

    if (!marketAsset) {
        logger.info("Market asset not found");
        return;
    }

    if (!collateralAsset) {
        logger.info("Collateral asset not found");
        return;
    }

    const borrowers = await getBorrowerStatusList(dbClient, {
        filters: {
            network,
        },
        orderBy: 'total_repay_amount DESC'
    });

    const priceFeed = await fetchAndProcessPriceFeed();
    const priceAttestationBuff = hexToUint8Array(priceFeed.attestation);
    const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);
    let swapRoute;

    if (batch.length === 0) {
        // logger.info("Nothing to liquidate");
        return;
    }

    const batchCV = liquidationBatchCv(batch);

    const totalSpendBn = batch.reduce((acc, b) => acc + b.liquidatorRepayAmount, 0);
    const totalSpend = formatUnits(totalSpendBn, marketAsset.decimals);
    const totalReceiveBn = batch.reduce((acc, b) => acc + b.minCollateralExpected, 0);
    const totalReceive = formatUnits(totalReceiveBn, collateralAsset.decimals);

    if (totalSpend < MIN_TO_LIQUIDATE) {
        logger.info(`Too small to liquidate. total spend: ${totalSpend}, total receive: ${totalReceive}`);
        return;
    }

    if (contract.network === 'mainnet') {
        // Profitability check
        swapRoute = await getBestSwap(totalReceive);

        if (swapRoute.out < totalSpend) {
            logger.error(`Not profitable to liquidate. total spend: ${totalSpend}, total receive: ${totalReceive}, best swap: ${swapRoute.out}`);
            return;
        }
    }

    let swapDataCv: ClarityValue = swapRoute ? swapOutCv(swapRoute): noneCV();

    const functionArgs = [
        someCV(bufferCV(priceAttestationBuff)),
        contractPrincipalCV(marketAsset.address.split(".")[0], marketAsset.address.split(".")[1]),
        contractPrincipalCV(collateralAsset.address.split(".")[0], collateralAsset.address.split(".")[1]),
        batchCV,
        uintCV(epoch() + TX_TIMEOUT),
        swapDataCv,
    ];

    const priv = await dbClient.query("SELECT operator_priv FROM contract WHERE id = $1", [contract.id]).then(r => r.rows[0].operator_priv);

    const nonce = (await getAccountNonces(contract.operatorAddress, contract.network)).possible_next_nonce;
    const fee = await estimateTxFeeOptimistic(contract.network);

    const txOptions = {
        contractAddress: contract.address,
        contractName: contract.name,
        functionName: "batch-liquidate",
        functionArgs,
        senderKey: priv,
        senderAddress: contract.operatorAddress,
        network: contract.network,
        fee,
        validateWithAbi: true,
        postConditionMode: PostConditionMode.Allow,
        nonce
    }

    let call;
    try {
        call = await makeContractCall({ ...txOptions, fee });
    } catch (e) {
        logger.error(`Could not make contract call2 due to: ${e}`);
        return;
    }

    const tx = await broadcastTransaction({ transaction: call, network: contract.network, client: { fetch: fetchFn } });

    if ("reason" in tx) {
        if ("reason_data" in tx) {
            logger.error("Transaction failed", { reason: tx.reason, reason_data: tx.reason_data });
        } else {
            logger.error("Transaction failed", { reason: tx.reason });
        }
        return;
    }

    if (tx.txid) {
        await dbClient.query("UPDATE contract SET lock_tx = $1 WHERE id = $2", [tx.txid, contract.id]);
        await dbClient.query("INSERT INTO transaction (txid, network, contract_id, batch, swap_route, fee, created) VALUES ($1, $2, $3, $4, $5, $6, $7)", 
            [tx.txid, contract.network, contract.id, batch, swapRoute, fee, epoch()]);
        logger.info(`Transaction broadcasted ${tx.txid}`);
        return;
    }
}

export const main = async () => {
    let dbClient = await pool.connect();
    await worker(dbClient, 'testnet');
    await worker(dbClient, 'mainnet');
    dbClient.release();
}