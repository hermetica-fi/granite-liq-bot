import { describe, expect, mock, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../db/migrate";
import { upsertBorrower } from "./db-helper";

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
    test("1 upsertBorrower (insert)", async () => {
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

    test("2 upsertBorrower (nothing)", async () => {
        const resp = await upsertBorrower(client, 'mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        expect(resp).toEqual(0);
    });

    test("3 upsertBorrower (update)", async () => {
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
})