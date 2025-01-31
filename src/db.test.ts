import { mock, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "./db/migrate";

const db = newDb();

const pool = db.adapters.createPg(10).Pool;

mock.module("./db/index", () => {
    return {
        pool: new pool()
    };
});

test("db test", async () => {
    await migrateDb()
});