import { describe, expect, mock, test } from "bun:test";
import { estimateSbtcToUsdhMint } from "./hermetica";

describe("dex hermetica", () => {
    test("estimateSbtcToUsdhMint", async () => {
        mock.module("./hermetica", () => {
            return {
                getPriceSlippage: () => {
                    return new Promise((res) => {
                        mock.restore()
                        res(500);
                    })
                }
            }
        });

        const result = await estimateSbtcToUsdhMint(0.0011094, 9488226303172n, '');
        expect(result).toEqual(99.99926347);
    });
});
