import { describe, expect, mock, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../db/migrate";
import {
    getAccrueInterestParamsLocal,
    getCollateralParamsLocal, getDebtParamsLocal,
    getIrParamsLocal,
    getLpParamsLocal, getMarketState,
    setAccrueInterestParamsLocal, setCollateralParamsLocal, setDebtParamsLocal,
    setIrParamsLocal, setLpParamsLocal
} from "./market";

const db = newDb();
const pg = db.adapters.createPg();
const pool = new pg.Pool();
const client = new pg.Client();

mock.module("../db/index", () => {
    return {
        pool
    };
});


mock.module("../constants", () => {
    return {
        BORROWER_SYNC_DELAY: 10
    };
});

await migrateDb();

describe("dba market", () => {
    test("IrParamsLocal", async () => {
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

    test("LpParamsLocal", async () => {
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

    test("AccrueInterestParamsLocal", async () => {
        await setAccrueInterestParamsLocal(client, 'mainnet', {
            lastAccruedBlockTime: 1000,
        });
        const resp = await getAccrueInterestParamsLocal(client, 'mainnet');
        expect(resp).toEqual({
            lastAccruedBlockTime: 1000,
        });
    });

    test("DebtParamsLocal", async () => {
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

    test("CollateralParamsLocal", async () => {
        await setCollateralParamsLocal(client, 'mainnet', {
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
            },
        });
        const resp = await getCollateralParamsLocal(client, 'mainnet');
        expect(resp).toEqual({
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
            },
        });
    });


    test("getMarketState", async () => {
        await client.query("DELETE FROM kv_store");

        expect(async () => { await getMarketState(client, 'mainnet') }).toThrow(Error('irParams not found'));
        await setIrParamsLocal(client, 'mainnet', {
            urKink: 100,
            baseIR: 1000,
            slope1: 2000,
            slope2: 3000,
        });

        expect(async () => { await getMarketState(client, 'mainnet') }).toThrow(Error('lpParams not found'));
        await setLpParamsLocal(client, 'mainnet', {
            totalAssets: 1000,
            totalShares: 2000,
        });

        expect(async () => { await getMarketState(client, 'mainnet') }).toThrow(Error('accrueInterestParams not found'));
        await setAccrueInterestParamsLocal(client, 'mainnet', {
            lastAccruedBlockTime: 1000,
        });

        expect(async () => { await getMarketState(client, 'mainnet') }).toThrow(Error('debtParams not found'));
        await setDebtParamsLocal(client, 'mainnet', {
            openInterest: 2000,
            totalDebtShares: 1000,
        });

        expect(async () => { await getMarketState(client, 'mainnet') }).toThrow(Error('collateralParams not found'));
        await setCollateralParamsLocal(client, 'mainnet', {});

        expect(async () => { await getMarketState(client, 'mainnet') }).toThrow(Error('collateralParams is empty'));
        await setCollateralParamsLocal(client, 'mainnet', {
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': {
                liquidationLTV: 100,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                maxLTV: 209,
            },
        });

        const resp = await getMarketState(client, 'mainnet');
        expect(resp).toEqual({
            irParams: {
                urKink: 100,
                baseIR: 1000,
                slope1: 2000,
                slope2: 3000,
            },
            lpParams: {
                totalAssets: 1000,
                totalShares: 2000,
            },
            accrueInterestParams: {
                lastAccruedBlockTime: 1000,
            },
            debtParams: {
                openInterest: 2000,
                totalDebtShares: 1000,
            },
            collateralParams: {
                "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": {
                    liquidationLTV: 100,
                    maxLTV: 200,
                },
                "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": {
                    liquidationLTV: 120,
                    maxLTV: 209,
                },
            },
            marketAssetParams: {
                decimals: 6
            }
        });
    });
});

