import { describe, expect, mock, test } from "bun:test";
import { estimateSbtcToAeusdc } from "./alex";

describe("dex alex", () => {
    test("estimateSbtcToAeusdc", async () => {
        mock.module("../client/stxer", () => {
            return {
                batchContractRead: () => {
                    return [
                        {
                            Ok: "0701000000000000000000000015d7d94960",
                        },
                    ]
                }
            }
        });

        const result = await estimateSbtcToAeusdc(0.01);
        expect(result).toEqual(938.15654752);
    });

    test("estimateSbtcToAeusdc err 1", async () => {
        mock.module("../client/stxer", () => {
            return {
                batchContractRead: () => {
                    return [
                        {
                            Ok: "0801000000000000000000000000000007db",
                        },
                    ]
                }
            }
        });

        const result = await estimateSbtcToAeusdc(0.01);
        expect(result).toEqual(0);
    });

    test("estimateSbtcToAeusdc err 2", async () => {
        mock.module("../client/stxer", () => {
            return {
                batchContractRead: () => {
                    return [
                        {
                            Err: "0701000000000000000000000015d7d94960",
                        },
                    ]
                }
            }
        });

        const result = await estimateSbtcToAeusdc(0.01);
        expect(result).toEqual(0);
    });

    test("estimateSbtcToAeusdc err 3", async () => {
        mock.module("../client/stxer", () => {
            return {
                batchContractRead: () => {
                    return [
                        
                    ]
                }
            }
        });

        const result = await estimateSbtcToAeusdc(0.01);
        expect(result).toEqual(0);
    });    
});
