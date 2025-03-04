import { dbCon } from "./con";

export const kvStoreGet = (key: string): string | undefined => {
    const row = dbCon.prepare('SELECT "value" FROM kv_store WHERE "key"=?', [key]).get() as any;
    return row ? row.value : undefined;
}

export const kvStoreSet = (key: string, value: any) => {
    const row = dbCon.prepare('SELECT "value" FROM kv_store WHERE "key"=?', [key]).get() as any;
 
    if(!row){
        dbCon.run('INSERT INTO kv_store VALUES (?, ?)', [key, value])
    } else {
        dbCon.run('UPDATE kv_store SET "value"=$1 WHERE "key"=$2', [value, key]);
    }
}