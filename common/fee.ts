
import { getMempoolTransactions } from "./hiro";
import type { NetworkName } from "./types";

const estimateTxFeeOptimistic = async (network: NetworkName): Promise<number> => {
    const mempoolSize = (await getMempoolTransactions(1, network)).total;

    if (mempoolSize > 300) {
        return 350000; // 0,35 STX
    } else if (mempoolSize > 200) {
        return 200000; // 0,2 STX
    } else if (mempoolSize > 100) {
        return 150000; // 0,15 STX
    } else if (mempoolSize > 50) {
        return 100000; // 0,1 STX
    } else {
        return 50000; // 0,05 STX
    }
}

export { estimateTxFeeOptimistic };
