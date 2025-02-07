import { describe, expect, test } from "bun:test";
import { getNetworkNameFromAddress } from "./helper";

describe("helper", () => {
    test("getNetworkNameFromAddress", () => {
        expect(getNetworkNameFromAddress("ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK")).toEqual("testnet");
        expect(getNetworkNameFromAddress("SN3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK")).toEqual("testnet");
        expect(getNetworkNameFromAddress("SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7")).toEqual("mainnet");
        expect(getNetworkNameFromAddress("SM3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7")).toEqual("mainnet");
    });
});

