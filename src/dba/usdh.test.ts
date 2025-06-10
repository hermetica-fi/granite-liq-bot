import { describe, expect, test } from "bun:test";
import { dbCon } from "../db/con";
import { getUsdhReserveBalanceLocal, getUsdhSafeTradeAmountLocal, getUsdhState, setUsdhReserveBalanceLocal, setUsdhSafeTradeAmountLocal } from "./usdh";

describe("dba usdh", () => {
    test("UsdhReserveBalanceLocal", () => {
        setUsdhReserveBalanceLocal(88000_000000);
        const resp = getUsdhReserveBalanceLocal();
        expect(resp).toEqual("88000000000");
    });

    test("UsdhReserveBalanceLocal", () => {
        setUsdhSafeTradeAmountLocal(37560);
        const resp = getUsdhSafeTradeAmountLocal();
        expect(resp).toEqual("37560");
    });

    test("getUsdhState", () => {
        dbCon.run("DELETE FROM kv_store");

        expect(() => { getUsdhState() }).toThrow(Error('usdhReserveBalance not found'));
        setUsdhReserveBalanceLocal(88000_000000);

        expect(() => { getUsdhState() }).toThrow(Error('usdhSafeTradeAmount not found'));
        setUsdhSafeTradeAmountLocal(37560);

        const resp = getUsdhState();
        expect(resp).toEqual({
            reserveBalance: 88000000000,
            safeTradeAmount: 37560
        });
    });
});

