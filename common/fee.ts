
import { getMempoolTransactions } from "./hiro";
import type { NetworkName } from "./types";

const estimateTxFeeOptimistic = async (network: NetworkName): Promise<number> => {
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

export { estimateTxFeeOptimistic };
