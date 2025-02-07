import { broadcastTransaction, bufferCV, contractPrincipalCV, makeContractCall, noneCV, PostConditionMode, someCV, uintCV } from "@stacks/transactions";
import { fetchFn, formatUnits, getAccountNonces, parseUnits, TESTNET_FEE } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { fetchAndProcessPriceFeed } from "../client/pyth";
import { pool } from "../db";
import { getBorrowerStatusList, getContractList } from "../db-helper";
import { hexToUint8Array, toTicker } from "../helper";
import { createLogger } from "../logger";
import type { LiquidationBatch } from "../types";
import { epoch } from "../util";
import { liquidationBatchCv, priceFeedCv } from "./lib";
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

    const mTicker = toTicker(marketAsset.symbol);
    const cTicker = toTicker(collateralAsset.symbol);
    const eTicker = "eth";
    const priceFeed = await fetchAndProcessPriceFeed();
    const mFeed = priceFeed.items[mTicker];
    const cFeed = priceFeed.items[cTicker];
    const eFeed = priceFeed.items[eTicker];


    if (!mFeed) {
        throw new Error("Market asset price feed not found");
    }

    if (!cFeed) {
        throw new Error("Collateral asset price feed not found");
    }

    const priceAttestationBuff = hexToUint8Array(priceFeed.attestation);

    const collateralPrice = formatUnits(Number(cFeed.price.price), -1 * cFeed.price.expo);
    const collateralPriceBn = parseUnits(collateralPrice, collateralAsset.decimals);

    const batch: LiquidationBatch[] = [];

    let availableBn = marketAsset.balance;

    for (const borrower of borrowers) {
        if (availableBn <= 0) {
            break;
        }

        const repayAmount = borrower.maxRepayAmount;
        // Adjust down max repay amount to prevent transaction failure in case volatility 
        // + removes decimals to protects from decimal precision issues (TODO: Not great solution, improve)
        const repayAmountAdjusted = Number((repayAmount * 0.9999).toFixed(0))
        const repayAmountAdjustedBn = parseUnits(repayAmountAdjusted, marketAsset.decimals);
        const repayAmountFinalBn = Math.min(availableBn, repayAmountAdjustedBn);

        availableBn = availableBn - repayAmountFinalBn;

        const minCollateralExpected = Number((repayAmountFinalBn / collateralPriceBn).toFixed(collateralAsset.decimals));
        const minCollateralExpectedBn = Math.floor(parseUnits(minCollateralExpected, collateralAsset.decimals));

        batch.push({
            user: borrower.address,
            liquidatorRepayAmount: repayAmountFinalBn,
            minCollateralExpected: minCollateralExpectedBn
        })

        /*
        console.log("maxRepayAmount           ", repayAmount);
        console.log("maxRepayAmountAdjusted   ", repayAmountAdjusted);
        console.log("maxRepayAmountAdjustedBn ", repayAmountAdjustedBn);
        console.log("repayAmountFinalBn       ", repayAmountFinalBn);
        console.log("minCollateralExpected    ", minCollateralExpected);
        console.log("minCollateralExpectedBn  ", minCollateralExpectedBn)
        */
    }

   

    if (batch.length === 0) {
        // Nothing to liquidate
        return;
    }

    const testnetPriceDataCV = priceFeedCv(priceFeed);

    const batchCV = liquidationBatchCv(batch);

    const functionArgs = [
        someCV(bufferCV(priceAttestationBuff)),
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