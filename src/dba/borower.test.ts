import { describe, expect, mock, setSystemTime, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../db/migrate";
import {
    clearBorrowerStatuses, getBorrowerCollateralAmount, getBorrowerStatusList, getBorrowersForHealthCheck,
    getBorrowersToSync, insertBorrowerStatus, switchBorrowerSyncFlagOff, syncBorrowerCollaterals,
    syncBorrowerPosition, upsertBorrower
} from "./borrower";

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

describe("dba borrower", () => {
    setSystemTime(1738262052565);
    test("upsertBorrower (insert)", async () => {
        let resp = await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        expect(resp).toEqual(1);

        let resp2 = await client.query("SELECT * FROM borrower").then((r: any) => r.rows);
        expect(resp2).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                sync_flag: 1,
                sync_ts: 1738262062
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
                sync_ts: 1738262062
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
                syncTs: 1738262062,
            }, {
                address: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                network: "testnet",
                syncTs: 1738262062,
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
                syncTs: 1738262062,
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
        await insertBorrowerStatus(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', 'mainnet', { ltv: 0.6977874992015272, health: 1.0206104956758972, debt: 526735.7296664099, collateral: 754865.5289313, risk: 0.9798057184761282, maxRepay: {}, totalRepayAmount: 0 });
        const resp = await client.query("SELECT * FROM borrower_status").then((r: any) => r.rows);
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                ltv: 0.6978,
                health: 1.0206,
                debt: 526735.7297,
                collateral: 754865.5289,
                risk: 0.9798,
                max_repay: {},
                total_repay_amount: 0
            }
        ])
    });

    test("getBorrowerStatusList", async () => {
        const resp = await getBorrowerStatusList(client, { filters: { network: 'mainnet' } });
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                ltv: 0.6978,
                health: 1.0206,
                debt: 526735.7297,
                collateral: 754865.5289,
                risk: 0.9798,
                maxRepay: {},
                totalRepayAmount: 0,
            }
        ]);

        const resp2 = await getBorrowerStatusList(client, { filters: { network: 'testnet' } });
        expect(resp2).toEqual([]);
    });

    test("clearBorrowerStatuses", async () => {
        await clearBorrowerStatuses(client);
        const resp = await client.query("SELECT * FROM borrower_status").then((r: any) => r.rows);
        expect(resp).toEqual([]);
    });
});
