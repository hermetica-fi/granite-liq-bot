
import { fetchFeeEstimateTransaction, makeContractCall, makeUnsignedContractCall, serializePayload, StacksTransactionWire, type SignedContractCallOptions, type UnsignedContractCallOptions } from "@stacks/transactions";
import { MAINNET_AVG_FEE, MAINNET_MAX_FEE, MAINNET_MIN_FEE, TESTNET_FEE } from "./constants";
import { fetchFn } from "./hiro";
import type { NetworkName } from "./types";

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
