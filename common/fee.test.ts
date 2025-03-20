import { describe, expect, mock, test } from "bun:test";
import { estimateTxFeeOptimistic } from "./fee";


describe("estimateTxFeeOptimistic", () => {
    test("1", async () => {
        mock.module("./hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 1200 })
            }
        });
        expect(await estimateTxFeeOptimistic('testnet')).toEqual(100000);
    });

    test("2", async () => {
        mock.module("./hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 290 })
            }
        });
        expect(await estimateTxFeeOptimistic('testnet')).toEqual(90000);
    });

    test("3", async () => {
        mock.module("./hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 126 })
            }
        });
        expect(await estimateTxFeeOptimistic('testnet')).toEqual(65000);
    });

    test("4", async () => {
        mock.module("./hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 58 })
            }
        });
        expect(await estimateTxFeeOptimistic('testnet')).toEqual(50000);
    });

    test("5", async () => {
        mock.module("./hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 12 })
            }
        });
        expect(await estimateTxFeeOptimistic('testnet')).toEqual(35000);
    });
});