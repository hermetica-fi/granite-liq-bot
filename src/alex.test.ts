import { cvToJSON } from "@stacks/transactions";
import { describe, expect, mock, test } from "bun:test";
import { getBestSwap } from "./alex";


describe("alex", () => {
    test("getBestSwap", async () => {

        mock.module("./client/stxer", () => {
            return {
                batchContractRead: () => {
                    return [
                        {
                            Ok: "07010000000000000000000000170ce2f6ef",
                        }, {
                            Ok: "07010000000000000000000000177802a131",
                        }, {
                            Ok: "07010000000000000000000000171bd413c8",
                        }, {
                            Ok: "0701000000000000000000000017372e7ede",
                        }
                    ]
                }
            }
        });

        const result = await getBestSwap(0.01);

        const pathJS = result?.option.path.map(x => cvToJSON(x));
        expect(pathJS).toEqual([
            {
                type: "principal",
                value: "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc",
            }, {
                type: "principal",
                value: "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex",
            }, {
                type: "principal",
                value: "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2",
            }, {
                type: "principal",
                value: "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc",
            }
        ]);

        const factorsJS = result?.option.factors.map(x => cvToJSON(x));
        expect(factorsJS).toEqual([
            {
                type: "uint",
                value: "100000000",
            }, {
                type: "uint",
                value: "100000000",
            }, {
                type: "uint",
                value: "100000000",
            }
        ]);

        expect(result?.out).toEqual(100797686065);
    });
});