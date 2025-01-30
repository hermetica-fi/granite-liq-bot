import { type PoolClient } from 'pg';
import { epoch } from '../util';

export const kvStoreGet = (db_client: PoolClient, key: string): Promise<string | undefined> => db_client.query('SELECT "value", expires FROM kv_store WHERE "key"=$1', [key]).then(r => {
    if (r.rows[0]) {
        if (r.rows[0].expires > 0 && r.rows[0].expires < epoch()) {
            return undefined;
        }
        return r.rows[0].value;
    }
    return undefined;
});

export const kvStoreSet = (db_client: PoolClient, key: string, value: any, expires: number = 0) => db_client.query('SELECT "value" FROM kv_store WHERE "key"=$1', [key]).then(r => {
    if (!r.rows[0]) {
        return db_client.query('INSERT INTO kv_store VALUES ($1, $2, $3)', [key, value, expires]).then(() => value);
    }

    return db_client.query('UPDATE kv_store SET "value"=$1, "expires"=$2 WHERE "key"=$3', [value, expires, key]);
});
