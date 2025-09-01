import { intCV, listCV, noneCV, principalCV, responseErrorCV, responseOkCV, someCV, tupleCV, uintCV } from "@stacks/transactions";
import { uint } from "@stacks/transactions/dist/cl";
import { expect, mock, test } from "bun:test";
import { getPythPriceFeed, getUserCollateralAmount, getUserPosition } from "./read-only-call";

test("getPythPriceFeed with success response", async () => {
    mock.module("@stacks/transactions", () => ({
        fetchCallReadOnlyFunction: async () => responseOkCV(tupleCV({
            "conf": uintCV(2961227449),
            "ema-conf": uintCV(3200851000),
            "ema-price": uint(11279433900000),
            "expo": intCV(-8),
            "prev-publish-time": uintCV(1755859534),
            "price": uintCV(11255522419598),
            "publish-time": uintCV(1755859534)
        }))
    }));

    expect(await getPythPriceFeed("0x")).toEqual({
        price: "11255522419598",
        expo: -8,
        publish_time: 1755859534,
    })
});

test("getPythPriceFeed with error response", async () => {
    mock.module("@stacks/transactions", () => ({
        fetchCallReadOnlyFunction: async () => responseErrorCV(uintCV(5002))
    }));

    expect(await getPythPriceFeed("0x")).toBe(null);
});


test("getUserPosition with position", async () => {
    mock.module("@stacks/transactions", () => ({
        fetchCallReadOnlyFunction: async () => someCV(tupleCV({
            "debt-shares": uintCV(39869),
            "collaterals": listCV([principalCV("SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token")])
        }))
    }));

    expect(await getUserPosition('SP26DT3NB64CSHBCQ4GMNWG3BBVWHC6Z0NF3KBNYQ')).toEqual({
        debtShares: 39869,
        collaterals: ['SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token']
    });
});

test("getUserPosition with no position", async () => {
    mock.module("@stacks/transactions", () => ({
        fetchCallReadOnlyFunction: async () => noneCV()
    }));

    expect(await getUserPosition('SP26DT3NB64CSHBCQ4GMNWG3BBVWHC6Z0NF3KBNYQ')).toEqual({
        debtShares: 0,
        collaterals: []
    });
});

test("getUserCollateralAmount with position", async () => {
    mock.module("@stacks/transactions", () => ({
        fetchCallReadOnlyFunction: async () => someCV(tupleCV({
            "amount": uintCV(100),
        }))
    }));

    expect(await getUserCollateralAmount('SP26DT3NB64CSHBCQ4GMNWG3BBVWHC6Z0NF3KBNYQ', 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token')).toBe(100)
});

test("getUserCollateralAmount with not position", async () => {
    mock.module("@stacks/transactions", () => ({
        fetchCallReadOnlyFunction: async () => noneCV()
    }));

    expect(await getUserCollateralAmount('SP26DT3NB64CSHBCQ4GMNWG3BBVWHC6Z0NF3KBNYQ', 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token')).toBe(0)
});
