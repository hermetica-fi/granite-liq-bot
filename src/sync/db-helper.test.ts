import { describe, expect, mock, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../db/migrate";
import {
    clearBorrowerStatuses,
    getAccrueInterestParamsLocal,
    getBorrowerCollateralAmount, getBorrowersForHealthCheck, getBorrowersToSync,
    getCollateralParamsLocal, getDebtParamsLocal, getDistinctCollateralList, getIrParamsLocal,
    getLpParamsLocal,
    getMarketState,
    getPriceFeedLocal,
    insertBorrowerStatus,
    setAccrueInterestParamsLocal, setCollateralParamsLocal, setDebtParamsLocal,
    setIrParamsLocal, setLpParamsLocal, setPriceFeedLocal,
    switchBorrowerSyncFlagOff, syncBorrowerCollaterals, syncBorrowerPosition, upsertBorrower
} from "./db-helper";

const db = newDb();
const pg = db.adapters.createPg();
const pool = new pg.Pool();
const client = new pg.Client();

mock.module("../db/index", () => {
    return {
        pool
    };
});

await migrateDb();

describe("sync db helper", () => {
    test("upsertBorrower (insert)", async () => {
        let resp = await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        expect(resp).toEqual(1);

        let resp2 = await client.query("SELECT * FROM borrower").then((r: any) => r.rows);
        expect(resp2).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                sync_flag: 1,
            }
        ]);
    });

    test("upsertBorrower (nothing)", async () => {
        const resp = await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        expect(resp).toEqual(0);
    });

    test("upsertBorrower (update)", async () => {
        await client.query("UPDATE borrower set sync_flag=0 WHERE address=$1", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']);
        const resp = await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        expect(resp).toEqual(2);
        const resp2 = await client.query("SELECT * FROM borrower").then((r: any) => r.rows);
        expect(resp2).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                sync_flag: 1,
            }
        ])
    });

    test("getBorrowersToSync", async () => {
        await client.query("DELETE FROM borrower");

        await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        await upsertBorrower(client, 'testnet', 'ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW');

        let resp = await getBorrowersToSync(client);
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
            }, {
                address: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                network: "testnet",
            }
        ]);
    });

    test("getBorrowersToSync (after update)", async () => {
        await switchBorrowerSyncFlagOff(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        const resp = await getBorrowersToSync(client);
        expect(resp).toEqual([
            {
                address: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                network: "testnet",
            }
        ]);
    });


    test("syncBorrowerPosition", async () => {
        await syncBorrowerPosition(client, { address: 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', network: 'mainnet', debtShares: 100, collaterals: ['SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc'] });
        const resp = await client.query("SELECT * FROM borrower_position WHERE address = $1", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']).then((r: any) => r.rows);
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                debt_shares: 100,
                collaterals: ["SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth", "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc"],
            }
        ]);
    });

    test("syncBorrowerCollaterals", async () => {
        await syncBorrowerCollaterals(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [{ collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', amount: 100, network: 'mainnet' }, { collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc', amount: 90, network: 'mainnet' }]);
        const resp = await client.query("SELECT * FROM borrower_collaterals WHERE address = $1", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']).then((r: any) => r.rows);
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                collateral: "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth",
                amount: 100,
            }, {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                collateral: "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc",
                amount: 90,
            }
        ]);
    });

    test("syncBorrowerCollaterals (update)", async () => {
        await syncBorrowerCollaterals(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [{ collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc', amount: 60, network: 'mainnet' }]);
        const resp = await client.query("SELECT * FROM borrower_collaterals WHERE address = $1", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']).then((r: any) => r.rows);
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                collateral: "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc",
                amount: 60,
            }
        ]);
    });

    test("getBorrowersForHealthCheck", async () => {
        await syncBorrowerPosition(client, { address: 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', network: 'mainnet', debtShares: 15, collaterals: ['SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc'] });
        await syncBorrowerPosition(client, { address: 'ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW', network: 'testnet', debtShares: 201, collaterals: ['ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW.mock-btc'] });

        const resp = await getBorrowersForHealthCheck(client);

        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                debtShares: 15,
                collaterals: ["SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth", "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc"],
            }, {
                address: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                network: "testnet",
                debtShares: 201,
                collaterals: ["ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW.mock-btc"],
            }
        ]);
    });


    test("getBorrowerCollateralAmount", async () => {
        await syncBorrowerCollaterals(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [{ network: 'mainnet', collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', amount: 100 }]);
        const resp = await getBorrowerCollateralAmount(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth');
        expect(resp).toEqual(100);
    });


    test("insertBorrowerStatus", async () => {
        await insertBorrowerStatus(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', 'mainnet', { health: 1.0206104956758972, debt: 526735.7296664099, collateral: 754865.5289313, risk: 0.9798057184761282, liquidateAmt: 0 });
        const resp = await client.query("SELECT * FROM borrower_status").then((r: any) => r.rows);
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                health: 1.0206,
                debt: 526735.7297,
                collateral: 754865.5289,
                risk: 0.9798,
                liquidate_amt: 0,
            }
        ])
    });

    test("clearBorrowerStatuses", async () => {
        await clearBorrowerStatuses(client);
        const resp = await client.query("SELECT * FROM borrower_status").then((r: any) => r.rows);
        expect(resp).toEqual([]);
    });


    test("getDistinctCollateralList", async () => {
        await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        await syncBorrowerCollaterals(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [
            { network: 'mainnet', collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', amount: 200 },
            { network: 'mainnet', collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc', amount: 300 },
        ]);
        const resp = await getDistinctCollateralList(client);
        expect(resp).toEqual(["SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth", "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc"]);
    });

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

    test("PriceFeedLocal", async () => {
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

