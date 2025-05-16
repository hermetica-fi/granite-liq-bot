import type { StacksNetworkName } from "@stacks/network";
import { broadcastTransaction, bufferCV, contractPrincipalCV, makeContractCall, PostConditionMode, serializeCVBytes, someCV, tupleCV, uintCV, type SignedContractCallOptions } from "@stacks/transactions";
import { fetchFn, getAccountNonces } from "../../client/hiro";
import { fetchAndProcessPriceFeed } from "../../client/pyth";
import { DRY_RUN, MIN_TO_LIQUIDATE, SKIP_SWAP_CHECK, TX_TIMEOUT, USDH_SLIPPAGE_TOLERANCE, USE_FLASH_LOAN, USE_USDH } from "../../constants";
import { getBorrowerStatusList, getBorrowersToSync } from "../../dba/borrower";
import { getContractList, getContractOperatorPriv, lockContract } from "../../dba/contract";
import { insertLiquidation } from "../../dba/liquidation";
import { getMarketState } from "../../dba/market";
import { estimateSbtcToAeusdc, getDexNameById } from "../../dex";
import { estimateTxFeeOptimistic } from "../../fee";
import { hexToUint8Array, toTicker } from "../../helper";
import { onLiqSwapOutError, onLiqTx, onLiqTxError } from "../../hooks";
import { createLogger } from "../../logger";
import { formatUnits } from "../../units";
import { epoch } from "../../util";
import { calcMinOut, liquidationBatchCv, makeLiquidationBatch } from "./lib";

const logger = createLogger("liquidate");

const worker = async () => {
    const contract = (getContractList({
        orderBy: 'CAST(market_asset_balance AS REAL) DESC'
    }))[0];

    if (!contract) {
        // logger.info(`No contract found`);
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
        orderBy: 'total_repay_amount DESC'
    });

    const marketState = getMarketState();
    const liquidationPremium = marketState.collateralParams[collateralAsset.address].liquidationPremium;

    const priceFeed = await fetchAndProcessPriceFeed();
    const cFeed = priceFeed.items[toTicker(collateralAsset.symbol)];
    if (!cFeed) {
        throw new Error("Collateral asset price feed not found");
    }
    const collateralPrice = Number(cFeed.price.price);
    const collateralPriceFormatted = formatUnits(collateralPrice, Math.abs(cFeed.price.expo)).toFixed(2);

    const priceAttestationBuff = hexToUint8Array(priceFeed.attestation);

    const flashLoanCapacity = USE_FLASH_LOAN ? (marketState.flashLoanCapacity[marketAsset.address] || 0) : 0;

    const batch = makeLiquidationBatch(marketAsset, collateralAsset, flashLoanCapacity, borrowers, collateralPrice, liquidationPremium);

    if (batch.length === 0) {
        // logger.info("Nothing to liquidate");
        return;
    }

    const batchCV = liquidationBatchCv(batch);

    const spendBn = batch.reduce((acc, b) => acc + b.liquidatorRepayAmount, 0);
    const spend = formatUnits(spendBn, marketAsset.decimals);
    const receiveBn = batch.reduce((acc, b) => acc + b.minCollateralExpected, 0);
    const receive = formatUnits(receiveBn, collateralAsset.decimals);

    if (spend < MIN_TO_LIQUIDATE) {
        // logger.info(`Too small to liquidate. spend: ${spend}, receive: ${receive}`);
        return;
    }

    // Swap check
    const minExpected = formatUnits(calcMinOut(spendBn, contract.unprofitabilityThreshold), marketAsset.decimals);
    const usdhContext = USE_USDH ? { btcPriceBn: BigInt(cFeed.price.price), minterContract: contract.id } : undefined;
    const swap = await estimateSbtcToAeusdc(receive, usdhContext);
    const dex = getDexNameById(swap.dex);

    if (swap.dy < minExpected) {
        logger.error(`Swap out is lower than min expected. spend: ${spend} usd, receive: ${receive} btc, min expected: ${minExpected} usd, dex: ${dex}, swap out: ${swap.dy} usd`);
        await onLiqSwapOutError(spend, receive, minExpected, dex, swap.dy);

        if (!SKIP_SWAP_CHECK) {
            return;
        }
    }

    if (DRY_RUN) {
        logger.info('Dry run mode on, skipping.', {
            spend: `${spend} usd`,
            receive: `${receive} btc`,
            minExpected: `${minExpected} usd`,
            dy: `${swap.dy} usd`,
            dex,
            batch,
        });
        return;
    }

    const priv = getContractOperatorPriv(contract.id)!;
    const nonce = (await getAccountNonces(contract.operatorAddress, 'mainnet')).possible_next_nonce;
    const fee = await estimateTxFeeOptimistic();

    let txOptions: SignedContractCallOptions;
    const baseTxOptions = {
        senderKey: priv,
        network: 'mainnet' as StacksNetworkName,
        fee,
        validateWithAbi: true,
        postConditionMode: PostConditionMode.Allow,
        nonce
    }
    const deadline = epoch() + TX_TIMEOUT;

    if (USE_USDH) {
        if (USE_FLASH_LOAN && marketAsset.balance < spendBn) {
            const callbackData = someCV(
                bufferCV(
                    serializeCVBytes(
                        tupleCV({
                            "pyth-price-feed-data": someCV(bufferCV(priceAttestationBuff)),
                            batch: batchCV,
                            deadline: uintCV(deadline),
                            dex: uintCV(999),
                            "btc-price": uintCV(cFeed.price.price),
                            "price-slippage-tolerance": uintCV(USDH_SLIPPAGE_TOLERANCE)
                        })
                    )
                )
            );

            const loanAmount = spendBn - marketAsset.balance;

            const functionArgs = [
                uintCV(loanAmount),
                contractPrincipalCV(contract.address, contract.name),
                callbackData
            ];

            txOptions = {
                contractAddress: contract.flashLoanSc.address,
                contractName: contract.flashLoanSc.name,
                functionName: "flash-loan",
                functionArgs,
                ...baseTxOptions
            }
        } else {
            const functionArgs = [
                someCV(bufferCV(priceAttestationBuff)),
                batchCV,
                uintCV(deadline),
                uintCV(cFeed.price.price),
                uintCV(USDH_SLIPPAGE_TOLERANCE)
            ];

            txOptions = {
                contractAddress: contract.address,
                contractName: contract.name,
                functionName: "liquidate-with-usdh-swap",
                functionArgs,
                ...baseTxOptions
            };
        }
    } else {
        if (USE_FLASH_LOAN && marketAsset.balance < spendBn) {
            const callbackData = someCV(
                bufferCV(
                    serializeCVBytes(
                        tupleCV({
                            "pyth-price-feed-data": someCV(bufferCV(priceAttestationBuff)),
                            batch: batchCV,
                            deadline: uintCV(deadline),
                            dex: uintCV(swap.dex),
                            "btc-price": uintCV(0),
                            "price-slippage-tolerance": uintCV(0)
                        })
                    )
                )
            );

            const loanAmount = spendBn - marketAsset.balance;

            const functionArgs = [
                uintCV(loanAmount),
                contractPrincipalCV(contract.address, contract.name),
                callbackData
            ];

            txOptions = {
                contractAddress: contract.flashLoanSc.address,
                contractName: contract.flashLoanSc.name,
                functionName: "flash-loan",
                functionArgs,
                ...baseTxOptions
            }
        } else {
            const functionArgs = [
                someCV(bufferCV(priceAttestationBuff)),
                batchCV,
                uintCV(deadline),
                uintCV(swap.dex)
            ];

            txOptions = {
                contractAddress: contract.address,
                contractName: contract.name,
                functionName: "liquidate-with-swap",
                functionArgs,
                ...baseTxOptions
            };
        }
    }

    const call = await makeContractCall({ ...txOptions, network: 'mainnet', client: { fetch: fetchFn } });
    const tx = await broadcastTransaction({ transaction: call, network: 'mainnet', client: { fetch: fetchFn } });

    if ("reason" in tx) {
        if ("reason_data" in tx) {
            logger.error("Transaction failed", { reason: tx.reason, reason_data: tx.reason_data });
        } else {
            logger.error("Transaction failed", { reason: tx.reason });
        }
        await onLiqTxError(tx.reason);
        return;
    }

    if (tx.txid) {
        lockContract(tx.txid, contract.id);
        insertLiquidation(tx.txid, contract.id);
        logger.info('Transaction broadcasted', {
            txid: tx.txid,
            collateralPrice: `${collateralPriceFormatted} usd (${collateralPrice})`,
            spend: `${spend} usd`,
            receive: `${receive} btc`,
            minExpected: `${minExpected} usd`,
            dy: `${swap.dy} usd`,
            dex,
            batch,
        });
        await onLiqTx(tx.txid, spend, receive, minExpected, dex, collateralPriceFormatted, batch);
        return;
    }
}

export const main = async () => {
    await worker();
}