import { describe, expect, mock, test } from "bun:test";
import { estimateTxFeeOptimistic } from "./fee";


describe("estimateTxFeeOptimistic", () => {
    test("1", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 1200 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(600000);
    });

    test("2", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 290 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(500000);
    });

    test("3", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 126 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(400000);
    });

    test("4", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 58 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(300000);
    });

    test("5", async () => {
        mock.module("./client/hiro", () => {
            return {
                getMempoolTransactions: () => ({ total: 12 })
            }
        });
        expect(await estimateTxFeeOptimistic()).toEqual(200000);
    });
});