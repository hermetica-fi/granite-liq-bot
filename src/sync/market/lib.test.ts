import { describe, expect, mock, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../../db/migrate";
import { syncBorrowerCollaterals } from "../borrower/lib";
import { upsertBorrower } from "../event/lib";
import {
    getAccrueInterestParamsLocal, getCollateralParamsLocal, getDebtParamsLocal, getDistinctCollateralList, getIrParamsLocal,
    getLpParamsLocal, getPriceFeedLocal, setAccrueInterestParamsLocal, setCollateralParamsLocal, setDebtParamsLocal,
    setIrParamsLocal, setLpParamsLocal, setPriceFeedLocal
} from "./lib";


const db = newDb();
const pg = db.adapters.createPg();
const pool = new pg.Pool();
const client = new pg.Client();

mock.module("../../db/index", () => {
    return {
        pool
    };
});

await migrateDb();

describe("market sync lib", () => {
    test("getDistinctCollateralList", async () => {
        await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        await syncBorrowerCollaterals(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [
            { network: 'mainnet', collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', amount: 200 },
            { network: 'mainnet', collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc', amount: 300 },
        ]);
        const resp = await getDistinctCollateralList(client);
        expect(resp).toEqual(["SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth", "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc"]);
    });

    test("IrParams", async () => {
        await setIrParamsLocal(client, 'mainnet', {
            urKink: 100,
            baseIR: 1000,
            slope1: 2000,
            slope2: 3000,
        });
        const resp = await getIrParamsLocal(client, 'mainnet');
        expect(resp).toEqual({
            urKink: 100,
            baseIR: 1000,
            slope1: 2000,
            slope2: 3000,
        });
    });

    test("LpParams", async () => {
        await setLpParamsLocal(client, 'mainnet', {
            totalAssets: 1000,
            totalShares: 1000,
        });
        const resp = await getLpParamsLocal(client, 'mainnet');
        expect(resp).toEqual({
            totalAssets: 1000,
            totalShares: 1000,
        });
    });

    test("AccrueInterestParams", async () => {
        await setAccrueInterestParamsLocal(client, 'mainnet', {
            lastAccruedBlockTime: 1000,
        });
        const resp = await getAccrueInterestParamsLocal(client, 'mainnet');
        expect(resp).toEqual({
            lastAccruedBlockTime: 1000,
        });
    });

    test("DebtParams", async () => {
        await setDebtParamsLocal(client, 'mainnet', {
            openInterest: 2000,
            totalDebtShares: 1000,
        });
        const resp = await getDebtParamsLocal(client, 'mainnet');
        expect(resp).toEqual({
            openInterest: 2000,
            totalDebtShares: 1000,
        });
    });

    test("CollateralParams", async () => {
        await setCollateralParamsLocal(client, 'mainnet', {
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                decimals: 18,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                decimals: 19,
                maxLTV: 209,
            },
        });
        const resp = await getCollateralParamsLocal(client, 'mainnet');
        expect(resp).toEqual({
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                decimals: 18,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                decimals: 19,
                maxLTV: 209,
            },
        });
    });

    test("PriceFeed", async () => {
        await setPriceFeedLocal(client, {
            btc: 100000,
            eth: 10000,
            usdc: 1000,
        });
        const resp = await getPriceFeedLocal(client);
        expect(resp).toEqual({
            btc: 100000,
            eth: 10000,
            usdc: 1000,
        });
    });
});