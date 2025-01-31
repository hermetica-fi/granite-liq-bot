import { describe, expect, mock, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../../db/migrate";
import { syncBorrowerCollaterals, syncBorrowerPosition } from "../borrower/lib";
import { upsertBorrower } from "../event/lib";
import { clearBorrowerStatuses, getBorrowerCollateralAmount, getBorrowersForHealthCheck, insertBorrowerStatus } from "./lib";

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

describe("health sync lib", () => {

    test("1 getBorrowersForHealthCheck", async () => {
        await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        await upsertBorrower(client, 'testnet', 'ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW');

        await syncBorrowerPosition(client, { address: 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', network: 'mainnet', borrowedAmount: 50, borrowedBlock: 2002, debtShares: 15, collaterals: ['SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc'] });
        await syncBorrowerPosition(client, { address: 'ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW', network: 'testnet', borrowedAmount: 191, borrowedBlock: 10001, debtShares: 201, collaterals: ['ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW.mock-btc'] });

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

    test("2 getBorrowerCollateralAmount", async () => {
        await syncBorrowerCollaterals(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [{ network: 'mainnet', collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', amount: 100 }]);
        const resp = await getBorrowerCollateralAmount(client, 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth');
        expect(resp).toEqual(100);
    });

    test("3 insertBorrowerStatus", async () => {
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

    test("4 clearBorrowerStatuses", async () => {
        await clearBorrowerStatuses(client);
        const resp = await client.query("SELECT * FROM borrower_status").then((r: any) => r.rows);
        expect(resp).toEqual([]);
    });
})