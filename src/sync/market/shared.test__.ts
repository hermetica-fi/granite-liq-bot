import { describe, expect, mock, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../../db/migrate";
import { setAccrueInterestParamsLocal, setCollateralParamsLocal, setDebtParamsLocal, setIrParamsLocal, setLpParamsLocal, setPriceFeedLocal } from "./lib";
import { getMarketState } from "./shared";


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

describe("market sync shared", () => {

    test("getMarketState", async () => {
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
                decimals: 18,
                maxLTV: 200,
            },
            'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': {
                liquidationLTV: 120,
                decimals: 19,
                maxLTV: 209,
            },
        });

        expect(async () => { await getMarketState(client, 'mainnet') }).toThrow(Error('priceFeed not found'));
        await setPriceFeedLocal(client, {
            btc: 100000,
            eth: 10000,
            usdc: 1000,
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
                    decimals: 18,
                    maxLTV: 200,
                },
                "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": {
                    liquidationLTV: 120,
                    decimals: 19,
                    maxLTV: 209,
                },
            },
            priceFeed: {
                btc: 100000,
                eth: 10000,
                usdc: 1000,
            },
        });
    });
});