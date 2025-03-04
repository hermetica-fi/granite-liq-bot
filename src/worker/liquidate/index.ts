import { broadcastTransaction, bufferCV, contractPrincipalCV, makeContractCall, noneCV, PostConditionMode, someCV, uintCV, type ClarityValue } from "@stacks/transactions";
import { estimateTxFeeOptimistic, fetchFn, formatUnits, getAccountNonces, type NetworkName } from "granite-liq-bot-common";
import { getBestSwap } from "../../alex";
import { fetchAndProcessPriceFeed } from "../../client/pyth";
import { DRY_RUN, MIN_TO_LIQUIDATE, TX_TIMEOUT } from "../../constants";
import { dbCon } from "../../db/con";
import { getBorrowerStatusList, getBorrowersToSync } from "../../dba/borrower";
import { getContractList, getContractOperatorPriv } from "../../dba/contract";
import { getMarketState } from "../../dba/market";
import { hexToUint8Array } from "../../helper";
import { createLogger } from "../../logger";
import { epoch } from "../../util";
import { liquidationBatchCv, makeLiquidationBatch, swapOutCv } from "./lib";

const logger = createLogger("liquidate");

const worker = async (network: NetworkName) => {
    const contract = (getContractList({
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

    if (getBorrowersToSync().length > 0) {
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

    const borrowers = getBorrowerStatusList({
        filters: {
            network,
        },
        orderBy: 'total_repay_amount DESC'
    });

    const marketState = getMarketState(network);
    const liquidationPremium = marketState.collateralParams[collateralAsset.address].liquidationPremium;
    if (!liquidationPremium) {
        throw new Error("Collateral liquidation premium not found");
    }

    const priceFeed = await fetchAndProcessPriceFeed();
    const priceAttestationBuff = hexToUint8Array(priceFeed.attestation);
    const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed, liquidationPremium);
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
        // logger.info(`Too small to liquidate. total spend: ${totalSpend}, total receive: ${totalReceive}`);
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

    if (DRY_RUN) {
        logger.info('Dry run mode on, skipping.', {
            totalSpend,
            totalReceive,
            batch
        });
        return;
    }

    let swapDataCv: ClarityValue = swapRoute ? swapOutCv(swapRoute) : noneCV();

    const functionArgs = [
        someCV(bufferCV(priceAttestationBuff)),
        contractPrincipalCV(marketAsset.address.split(".")[0], marketAsset.address.split(".")[1]),
        contractPrincipalCV(collateralAsset.address.split(".")[0], collateralAsset.address.split(".")[1]),
        batchCV,
        uintCV(epoch() + TX_TIMEOUT),
        swapDataCv,
    ];

    const priv = getContractOperatorPriv(contract.id)!;
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
        dbCon.run("UPDATE contract SET lock_tx = ? WHERE id = ?", [tx.txid, contract.id]);
        logger.info(`Transaction broadcasted ${tx.txid}`);
        console.log('Batch', batch);
        return;
    }
}

export const main = async () => {
    await worker('testnet');
    await worker('mainnet');
}