import { broadcastTransaction, bufferCV, Cl, contractPrincipalCV, intCV, listCV, makeContractCall, noneCV, PostConditionMode, principalCV, serializeCVBytes, someCV, tupleCV, uintCV } from "@stacks/transactions";
import { fetchFn, formatUnits, getAccountNonces, parseUnits, TESTNET_FEE } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { fetchAndProcessPriceFeed } from "../client/pyth";
import { PRICE_FEED_IDS } from "../constants";
import { pool } from "../db";
import { getBorrowerStatusList, getContractList } from "../db-helper";
import { hexToUint8Array, symbolToTicker } from "../helper";
import { createLogger } from "../logger";
import { epoch } from "../util";

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

    const mTicker = symbolToTicker(marketAsset.symbol);
    const cTicker = symbolToTicker(collateralAsset.symbol);
    const eTicker = "eth";
    const priceFeed = await fetchAndProcessPriceFeed([
        { ticker: mTicker, price_feed: PRICE_FEED_IDS[mTicker] },
        { ticker: cTicker, price_feed: PRICE_FEED_IDS[cTicker] },
        { ticker: eTicker, price_feed: PRICE_FEED_IDS[eTicker] },
    ]);
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

    const batch: {
        user: string,
        liquidatorRepayAmount: number,
        minCollateralExpected: number
    }[] = [];

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


    const testnetPriceDataCV = someCV(
        bufferCV(
            serializeCVBytes(
                listCV([
                    tupleCV({
                        "price-identifier": Cl.bufferFromHex(cFeed.id),
                        "price": intCV(cFeed.price.price),
                        "conf": uintCV(cFeed.price.conf),
                        "expo": intCV(cFeed.price.expo),
                        "ema-price": intCV(cFeed.ema_price.price),
                        "ema-conf": uintCV(cFeed.ema_price.conf),
                        "publish-time": uintCV(cFeed.price.publish_time),
                        "prev-publish-time": uintCV(cFeed.metadata.prev_publish_time)
                    }),
                    tupleCV({
                        "price-identifier": Cl.bufferFromHex(mFeed.id),
                        "price": intCV(mFeed.price.price),
                        "conf": uintCV(mFeed.price.conf),
                        "expo": intCV(mFeed.price.expo),
                        "ema-price": intCV(mFeed.ema_price.price),
                        "ema-conf": uintCV(mFeed.ema_price.conf),
                        "publish-time": uintCV(mFeed.price.publish_time),
                        "prev-publish-time": uintCV(mFeed.metadata.prev_publish_time)
                    }),
                    tupleCV({
                        "price-identifier": Cl.bufferFromHex(eFeed.id),
                        "price": intCV(eFeed.price.price),
                        "conf": uintCV(eFeed.price.conf),
                        "expo": intCV(eFeed.price.expo),
                        "ema-price": intCV(eFeed.ema_price.price),
                        "ema-conf": uintCV(eFeed.ema_price.conf),
                        "publish-time": uintCV(eFeed.price.publish_time),
                        "prev-publish-time": uintCV(eFeed.metadata.prev_publish_time)
                    }),
                ])
            )
        )
    )

    const batchCV = listCV(batch.map(b => someCV(
        tupleCV({
            "user": principalCV(b.user),
            "liquidator-repay-amount": uintCV(b.liquidatorRepayAmount),
            "min-collateral-expected": uintCV(b.minCollateralExpected)
        }))))

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