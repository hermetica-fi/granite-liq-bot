
import { fetchFeeEstimateTransaction, serializePayload, type StacksTransactionWire } from "@stacks/transactions";
import { MAINNET_AVG_FEE, MAINNET_MAX_FEE, MAINNET_MIN_FEE, TESTNET_FEE } from "./constants";
import { fetchFn } from "./hiro";
import type { NetworkName } from "./types";

const setTxFee = async (tx: StacksTransactionWire, network: NetworkName) => {
    if (network === 'testnet') {
        tx.setFee(TESTNET_FEE);
        return;
    }

    let feeEstimate;

    try {
        feeEstimate = await fetchFeeEstimateTransaction({ payload: serializePayload(tx.payload), network, client: { fetch: fetchFn } });
    } catch (e) {
        console.error(`Could not fetch fee estimate: ${e}`);
        return;
    }

    if (!feeEstimate) {
        // No fee estimation
        tx.setFee(MAINNET_AVG_FEE);
        return;
    }

    let fee = feeEstimate[1].fee;

    if (fee < MAINNET_MIN_FEE) {
        // The estimation seem too low. Probably not correct.
        tx.setFee(MAINNET_MIN_FEE);
        return;
    }
    
    // Pick lower.
    tx.setFee(Math.min(fee, MAINNET_MAX_FEE));
}

export { setTxFee };
