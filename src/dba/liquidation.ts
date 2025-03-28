import { dbCon } from "../db/con";
import type { LiquidationEntity } from "../types";
import { epoch } from "../util";

export const insertLiquidation = (txid: string, contract: string) => {
    dbCon.run(`INSERT INTO liquidation (txid, contract, created_at) VALUES (?, ?, ?)`, [txid, contract, epoch()]);
}

export const finalizeLiquidation = (txid: string, status: string) => {
    dbCon.run("UPDATE liquidation SET status = ?, updated_at = ? WHERE txid = ?", [status, epoch(), txid]);
}

export const getLiquidationList = (args: {
    filters?: Record<string, string>,
    orderBy?: 'created_at DESC',
    limit?: number,
}): LiquidationEntity[] => {
    const filters = args?.filters || {};
    const orderBy = args?.orderBy || 'created_at DESC';
    const limit = args?.limit || 10;

    let sql = 'SELECT txid, contract, status, created_at, updated_at FROM liquidation';
    if (Object.keys(filters).length > 0) {
        sql += ' WHERE ' + Object.keys(filters).map((key) => `${key} = ?`).join(' AND ');
    }
    sql += ` ORDER BY ${orderBy} LIMIT ${limit}`;

    const rows = dbCon.prepare(sql, Object.values(filters)).all() as any[];
    return rows.map(row => ({
        txid: row.txid,
        contract: row.contract,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}