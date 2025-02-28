import type { PoolClient } from "pg";
import { CONTRACTS } from "../constants";
import { pool } from "../db";

export const createDb = async (client: PoolClient) => {
    let CREATE = "CREATE TABLE IF NOT EXISTS public.kv_store(" +
        "key VARCHAR PRIMARY KEY NOT NULL," +
        "value VARCHAR NOT NULL," +
        "expires INTEGER NOT NULL DEFAULT 0" +
        ");";

    CREATE += "CREATE TABLE IF NOT EXISTS public.contract(" +
        "id VARCHAR PRIMARY KEY NOT NULL," +
        "address VARCHAR NOT NULL," +
        "name VARCHAR NOT NULL," +
        "network VARCHAR NOT NULL," +
        "operator_address VARCHAR NOT NULL," +
        "operator_priv VARCHAR NOT NULL," +
        "market_asset JSON," +
        "market_asset_balance NUMERIC NOT NULL DEFAULT 0," +
        "collateral_asset JSON," +
        "collateral_asset_balance NUMERIC NOT NULL DEFAULT 0," +
        "lock_tx VARCHAR," +
        "unlocks_at INTEGER," +
        "created_at INTEGER NOT NULL" +
        ");";

    CREATE += "CREATE INDEX IF NOT EXISTS contract_network_idx ON contract (network);";

    CREATE += "CREATE TABLE IF NOT EXISTS public.borrower(" +
        "address VARCHAR PRIMARY KEY NOT NULL," +
        "network VARCHAR NOT NULL," +
        "sync_flag INTEGER NOT NULL DEFAULT 1," +
        "sync_ts INTEGER NOT NULL DEFAULT 0" +
        ");";


    CREATE += "CREATE TABLE IF NOT EXISTS public.borrower_position(" +
        "address VARCHAR PRIMARY KEY REFERENCES borrower(address) ON DELETE RESTRICT," +
        "network VARCHAR NOT NULL," +
        "debt_shares NUMERIC NOT NULL," +
        "collaterals VARCHAR[] NOT NULL" +
        ");";


    CREATE += "CREATE TABLE IF NOT EXISTS public.borrower_collaterals(" +
        "address VARCHAR NOT NULL REFERENCES borrower(address) ON DELETE RESTRICT," +
        "network VARCHAR NOT NULL," +
        "collateral VARCHAR NOT NULL," +
        "amount NUMERIC NOT NULL" +
        ");";

    CREATE += "CREATE UNIQUE INDEX IF NOT EXISTS borrower_collateral_address_idx ON borrower_collaterals (address, collateral);";

    CREATE += "CREATE TABLE IF NOT EXISTS public.borrower_status(" +
        "address VARCHAR PRIMARY KEY REFERENCES borrower(address) ON DELETE RESTRICT," +
        "network VARCHAR NOT NULL," +
        "ltv NUMERIC NOT NULL," +
        "health NUMERIC NOT NULL," +
        "debt NUMERIC NOT NULL," +
        "collateral NUMERIC NOT NULL," +
        "risk NUMERIC NOT NULL," +
        "max_repay JSON NOT NULL," +
        "total_repay_amount NUMERIC NOT NULL" +
        ");";

    CREATE += "INSERT INTO kv_store VALUES ('db_ver', 1);";
    CREATE += "INSERT INTO kv_store VALUES ('contract_hash', '" + Bun.hash(JSON.stringify(CONTRACTS)).toString() + "');";

    return client.query(CREATE, []).then(() => {
        console.log("db created")
    }).catch(e => {
        console.log(e);
    });
};

const updateDbVer = (client: PoolClient, ver: number) => client.query('UPDATE kv_store SET "value"=$1 WHERE key=$2', [ver, 'db_ver']).then(() => {
    console.log(`db migrated to ver. ${ver}`);
});

const migrateToV2 = async (client: PoolClient): Promise<number> => {
    await client.query("BEGIN");
    await client.query("CREATE TABLE .....");
    await updateDbVer(client, 2);

    try {
        await client.query("COMMIT");
        return 2;
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    }
};


const IS_TEST = process.env.NODE_ENV === "test";

export const migrateDb = async () => {
    const dbClient = await pool.connect();

    if (!IS_TEST) {
        await dbClient.query("SELECT pg_advisory_lock(123456);");
    }

    const exists = IS_TEST ? false : await dbClient.query("SELECT to_regclass('public.kv_store') as x", []).then(r => r.rows[0].x);

    if (!exists) {
        await createDb(dbClient);
    } else {
        const contractHash = await dbClient.query('SELECT "value" FROM kv_store where "key"=$1 LIMIT 1', ["contract_hash"]).then(r => r.rows[0]?.value || '');
        if (contractHash !== Bun.hash(JSON.stringify(CONTRACTS)).toString()) {
            throw new Error(`Can't change contracts. Revert it to previous version or reset database and start from zero.`);
        }
    }

    let dbVer = await dbClient.query('SELECT "value" FROM kv_store where "key"=$1 LIMIT 1', ["db_ver"]).then(r => Number(r.rows[0].value));

    /*
    if (dbVer < 2) {
        await migrateToV2(dbClient);
    }
    */

    if (!IS_TEST) {
        await dbClient.query("SELECT pg_advisory_unlock(123456);");
    }
}
