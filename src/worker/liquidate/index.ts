import { broadcastTransaction, bufferCV, contractPrincipalCV, fetchFeeEstimateTransaction, makeContractCall, noneCV, PostConditionMode, serializePayload, someCV, uintCV, type ClarityValue } from "@stacks/transactions";
import { fetchFn, formatUnits, getAccountNonces, MAINNET_AVG_FEE, MAINNET_MAX_FEE, MAINNET_MIN_FEE, TESTNET_FEE, type NetworkName } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { getBestSwap } from "../../alex";
import { fetchAndProcessPriceFeed } from "../../client/pyth";
import { pool } from "../../db";
import { getBorrowerStatusList, getContractList } from "../../db-helper";
import { hexToUint8Array } from "../../helper";
import { createLogger } from "../../logger";
import { epoch } from "../../util";
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

    if (batch.length === 0) {
        // logger.info("Nothing to liquidate");
        return;
    }

    const batchCV = liquidationBatchCv(batch);
    let swapDataCv: ClarityValue = noneCV();

    if (contract.network === 'mainnet') {
        // Profitability check
        const totalSpendBn = batch.reduce((acc, b) => acc + b.liquidatorRepayAmount, 0);
        const totalSpend = formatUnits(totalSpendBn, marketAsset.decimals);
        const totalReceiveBn = batch.reduce((acc, b) => acc + b.minCollateralExpected, 0);
        const totalReceive = formatUnits(totalReceiveBn, collateralAsset.decimals);
        const bestSwap = await getBestSwap(totalReceive);

        if (bestSwap.out < totalSpend) {
            logger.error(`Not profitable to liquidate. total spend: ${totalSpend}, total receive: ${totalReceive}, best swap: ${bestSwap.out}`);
            return;
        }

        swapDataCv = swapOutCv(bestSwap);
    }

    const functionArgs = [
        someCV(bufferCV(priceAttestationBuff)),
        contractPrincipalCV(marketAsset.address.split(".")[0], marketAsset.address.split(".")[1]),
        contractPrincipalCV(collateralAsset.address.split(".")[0], collateralAsset.address.split(".")[1]),
        batchCV,
        uintCV(epoch() + (60 * 4)),
        swapDataCv,
    ];

    const priv = await dbClient.query("SELECT operator_priv FROM contract WHERE id = $1", [contract.id]).then(r => r.rows[0].operator_priv);

    const nonce = (await getAccountNonces(contract.operatorAddress, contract.network)).possible_next_nonce;

    const txOptions = {
        contractAddress: contract.address,
        contractName: contract.name,
        functionName: "batch-liquidate",
        functionArgs,
        senderKey: priv,
        senderAddress: contract.operatorAddress,
        network: contract.network,
        fee: TESTNET_FEE,
        validateWithAbi: true,
        postConditionMode: PostConditionMode.Allow,
        nonce
    }

    let contractCall;

    try {
        contractCall = await makeContractCall(txOptions);
    } catch (e) {
        logger.error(`Could not make contract call due to: ${e}`);
        return;
    }

    if (contract.network === 'mainnet') {
        let feeEstimate;

        try {
            feeEstimate = await fetchFeeEstimateTransaction({ payload: serializePayload(contractCall.payload), network: contract.network, client: { fetch: fetchFn } });
        } catch (e) {
            logger.error(`Could not fetch fee estimate due to: ${e}`);
            return;
        }

        if (feeEstimate) {
            let fee = feeEstimate[1].fee;
            if (fee < MAINNET_MIN_FEE) {
                fee = MAINNET_MIN_FEE;
            }
            contractCall.setFee(Math.min(fee, MAINNET_MAX_FEE));
        } else {
            contractCall.setFee(MAINNET_AVG_FEE);
        }
    }

    const tx = await broadcastTransaction({ transaction: contractCall, network: contract.network, client: { fetch: fetchFn } });

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