import { describe, expect, mock, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../../db/migrate";
import { getBorrowersToSync, switchBorrowerSyncFlagOff, syncBorrowerCollaterals, syncBorrowerPosition } from "./lib";

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

describe("borrower sync lib", () => {

    test("1 getBorrowersToSync", async () => {
        await client.query("INSERT INTO borrower (address, network) VALUES ('SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', 'mainnet')");
        await client.query("INSERT INTO borrower (address, network) VALUES ('ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW', 'testnet')");
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

    test("2 getBorrowersToSync", async () => {
        await switchBorrowerSyncFlagOff(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        const resp = await getBorrowersToSync(client);
        expect(resp).toEqual([
            {
                address: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                network: "testnet",
            }
        ]);
    });

    test("3 syncBorrowerPosition", async () => {
        await syncBorrowerPosition(client, { address: 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', network: 'mainnet', borrowedAmount: 100, borrowedBlock: 100, debtShares: 100, collaterals: ['SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc'] });
        const resp = await client.query("SELECT * FROM borrower_position WHERE address = $1", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']).then((r: any) => r.rows);
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                borrowed_amount: 100,
                borrowed_block: 100,
                debt_shares: 100,
                collaterals: ["SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth", "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc"],
            }
        ]);
    });

    test("4 syncBorrowerCollaterals", async () => {
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

    test("5 syncBorrowerCollaterals (update)", async () => {
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
});
