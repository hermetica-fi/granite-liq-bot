import { dbCon } from "../db/con";

export type Filter = [string, ('=' | '>' | '<' | '>=' | '<='), any];

export const makeSelectSql = (args: { fields: string, table: string, filters: Filter[], orderBy?: string, limit?: number }) => {
    let sql = `SELECT ${args.fields} FROM ${args.table}`;
    if (args.filters.length > 0) {
        sql += ' WHERE ' + args.filters.map((f) => `${f[0]} ${f[1]} ?`).join(' AND ');
    }
    if (args.orderBy) {
        sql += ` ORDER BY ${args.orderBy}`;
    }

    if (args.limit) {
        sql += ` LIMIT ${args.limit}`;
    }

    return sql;
}

export const makeBindings = (filters: Filter[]) => {
    return filters.map(f => f[2]);
}

export const sqlSelect = (args: { fields: string, table: string, filters: Filter[], orderBy?: string, limit?: number }) => {
    return dbCon.prepare(makeSelectSql(args), makeBindings(args.filters)).all() as any[];
}