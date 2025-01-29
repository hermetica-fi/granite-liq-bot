import {type PoolClient} from 'pg';

export const kvStoreGet = (db_client: PoolClient, key: string): Promise<string | undefined> => db_client.query('SELECT "value" FROM kv_store WHERE "key"=$1', [key]).then(r => r.rows[0]?.value);

export const kvStoreSet = (db_client: PoolClient, key: string, value: any) => db_client.query('SELECT "value" FROM kv_store WHERE "key"=$1', [key]).then(r => {
    if (!r.rows[0]) {
        return db_client.query('INSERT INTO kv_store VALUES ($1, $2)', [key, value]).then(() => value);
    }

    return db_client.query('UPDATE kv_store SET "value"=$1 WHERE "key"=$2', [value, key]);
});