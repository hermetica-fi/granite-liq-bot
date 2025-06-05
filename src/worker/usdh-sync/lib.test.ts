import { expect, mock, test } from "bun:test";
import { findMaxSafeTradeAmount } from "./lib";


test("findMaxSafeTradeAmount", async () => {
    let i = 0;
    const quoteRespSet = [405698.330469, 247652.768682, 124552.222567, 62384.258847, 93499.339415, 77948.897224,
        85725.466179, 89612.37669, 87669.037955, 86696.783453, 87182.420403, 87425.233439,
        87546.638595, 87607.340832];

    mock.module("../../dex/bitflow", () => {
        return {
            estimateUsdhToToAeusdc: () => {
                const quoteResp = quoteRespSet[i];
                i += 1;
                return quoteResp;
            }
        }
    });
    expect(await findMaxSafeTradeAmount()).toEqual(87766);
});
