
import { fetchFeeEstimateTransaction, makeContractCall, makeUnsignedContractCall, serializePayload, StacksTransactionWire, type SignedContractCallOptions, type UnsignedContractCallOptions } from "@stacks/transactions";
import { MAINNET_AVG_FEE, MAINNET_MAX_FEE, MAINNET_MIN_FEE, TESTNET_FEE } from "./constants";
import { fetchFn, getMempoolTransactions } from "./hiro";
import type { NetworkName } from "./types";

export const estimateTxFeeOptimistic = async (network: NetworkName): Promise<number> => {
    const mempoolSize = (await getMempoolTransactions(1, network)).total;

    if (mempoolSize > 300) {
        return 750000; // 0,75 STX
    } else if (mempoolSize > 200) {
        return 500000; // 0,5 STX
    } else if (mempoolSize > 100) {
        return 250000; // 0,25 STX
    } else if (mempoolSize > 50) {
        return 100000; // 0,1 STX
    } else {
        return 50000; // 0,05 STX
    }
}


const estimateSignedCallTxFee = async (txOptions: SignedContractCallOptions, network: NetworkName) => {
    if (network === 'testnet') {
        return TESTNET_FEE;
    }

    let tx;
    try {
        tx = await makeContractCall(txOptions);
    } catch (e) {
        throw e;
    }

    return estimateTxFee(tx, network);
}

const estimateUnsignedCallTxFee = async (txOptions: UnsignedContractCallOptions, network: NetworkName) => {
    if (network === 'testnet') {
        return TESTNET_FEE;
    }

    let tx;
    try {
        tx = await makeUnsignedContractCall(txOptions);
    } catch (e) {
        throw e;
    }

    return estimateTxFee(tx, network);
}

const estimateTxFee = async (tx: StacksTransactionWire, network: NetworkName) => {
    let feeEstimate;

    try {
        feeEstimate = await fetchFeeEstimateTransaction({ payload: serializePayload(tx.payload), network, client: { fetch: fetchFn } });
    } catch (e) {
        console.error(`Could not fetch fee estimate: ${e}`);
    }

    if (!feeEstimate) {
        // No fee estimation
        return MAINNET_AVG_FEE;
    }

    let fee = feeEstimate[1].fee;

    if (fee < MAINNET_MIN_FEE) {
        // The estimation seem too low. Probably not correct.
        return MAINNET_MIN_FEE;
    }

    // Pick lower.
    return Math.min(fee, MAINNET_MAX_FEE);
}

export { estimateSignedCallTxFee, estimateUnsignedCallTxFee };
