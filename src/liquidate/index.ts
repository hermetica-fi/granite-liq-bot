import { broadcastTransaction, bufferCV, contractPrincipalCV, makeContractCall, noneCV, PostConditionMode, someCV, uintCV } from "@stacks/transactions";
import { fetchFn, getAccountNonces, TESTNET_FEE } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { fetchAndProcessPriceFeed } from "../client/pyth";
import { pool } from "../db";
import { getBorrowerStatusList, getContractList } from "../db-helper";
import { hexToUint8Array } from "../helper";
import { createLogger } from "../logger";
import { epoch } from "../util";
import { liquidationBatchCv, makeLiquidationBatch, priceFeedCv } from "./lib";
const logger = createLogger("liquidate");


const worker = async (dbClient: PoolClient) => {
    const contract = (await getContractList(dbClient, {
        filters: {
            network: 'testnet',
        },
        orderBy: 'market_asset_balance DESC'
    }))[0];

    if (!contract) {
        logger.info("No testnet contract found");
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
            network: 'testnet',
        },
        orderBy: 'max_repay_amount DESC'
    });


    const priceFeed = await fetchAndProcessPriceFeed();
    const priceAttestationBuff = hexToUint8Array(priceFeed.attestation);
    const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);

    if (batch.length === 0) {
        // Nothing to liquidate
        return;
    }

    const batchCV = liquidationBatchCv(batch);
    const testnetPriceDataCV = contract.network === 'testnet' ? priceFeedCv(priceFeed) : noneCV();

    const functionArgs = [
        someCV(bufferCV(priceAttestationBuff)),
        uintCV(0),
        contractPrincipalCV(marketAsset.address.split(".")[0], marketAsset.address.split(".")[1]),
        contractPrincipalCV(collateralAsset.address.split(".")[0], collateralAsset.address.split(".")[1]),
        batchCV,
        uintCV(epoch() + (60 * 4)),
        noneCV(),
        testnetPriceDataCV
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

    /*

        if (contract.network === 'mainnet') {
            let feeEstimate;

            try {
                feeEstimate = await fetchFeeEstimateTransaction({ payload: serializePayload(transaction.payload), network: contract.network, client: { fetch: fetchFn } });
            } catch (e) {
                return errorResponse('Could not get fee estimate');
            }

            const fee = feeEstimate[1].fee;
            transaction.setFee(Math.min(fee, MAINNET_MAX_FEE));
        }
    */

    const transaction = await makeContractCall(txOptions);
    const tx = await broadcastTransaction({ transaction, network: contract.network, client: { fetch: fetchFn } });
    console.log("tx", tx)
}

export const main = async () => {
    let dbClient = await pool.connect();
    await worker(dbClient)
    dbClient.release();
}

main()