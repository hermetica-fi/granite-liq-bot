import type { PoolClient } from "pg";
import { pool } from "../db";

export const createDb = async (client: PoolClient) => {
    let CREATE = "CREATE TABLE IF NOT EXISTS public.kv_store(" +
        "key VARCHAR PRIMARY KEY NOT NULL," +
        "value VARCHAR NOT NULL" +
        ");";


    CREATE += "CREATE TABLE IF NOT EXISTS public.contracts(" +
        "id VARCHAR PRIMARY KEY NOT NULL," +
        "address VARCHAR NOT NULL," +
        "name VARCHAR NOT NULL," +
        "network VARCHAR NOT NULL," +
        "owner_address VARCHAR NOT NULL," +
        "owner_priv VARCHAR NOT NULL," +
        "created_at TIMESTAMP NOT NULL DEFAULT NOW()" +
        ");";

    CREATE += "CREATE TABLE IF NOT EXISTS public.borrowers(" +
        "address VARCHAR PRIMARY KEY NOT NULL," +
        "network VARCHAR NOT NULL," +
        "lp_shares VARCHAR DEFAULT '0'," +
        "last_sync INTEGER NOT NULL DEFAULT 0" +
        ");";

    CREATE += "CREATE TABLE IF NOT EXISTS public.transactions(" +
        "tx_id VARCHAR PRIMARY KEY NOT NULL," +
        "contract_address VARCHAR NOT NULL," +
        "tx_sender VARCHAR NOT NULL," +
        "nonce INTEGER NOT NULL," +
        "fee VARCHAR NOT NULL," +
        "status VARCHAR NOT NULL DEFAULT 'pending'," +
        "created_at TIMESTAMP NOT NULL DEFAULT NOW()" +
        ");";

    CREATE += "INSERT INTO kv_store VALUES ('db_ver', 1);";

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

export const migrateDb = async () => {
    const dbClient = await pool.connect();
    await dbClient.query("SELECT pg_advisory_lock(123456);");

    const exists = await dbClient.query("SELECT to_regclass('public.kv_store') as x", []).then(r => r.rows[0].x);

    if (!exists) {
        await createDb(dbClient);
    }

    let dbVer = await dbClient.query('SELECT "value" FROM kv_store where "key"=$1 LIMIT 1', ["db_ver"]).then(r => Number(r.rows[0].value));

    /*
    if (dbVer < 2) {
        await migrateToV2(dbClient);
    }
    */

    await dbClient.query("SELECT pg_advisory_unlock(123456);");
}
