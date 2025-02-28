import { type BorrowerStatusEntity } from "granite-liq-bot-common";
import type { PoolClient } from "pg";

export const getBorrowerStatusList = async (dbClient: PoolClient, args?: {
    filters?: Record<string, string>,
    orderBy?: 'total_repay_amount DESC, risk DESC' | 'total_repay_amount DESC'
}): Promise<BorrowerStatusEntity[]> => {
    const filters = args?.filters || {};
    const orderBy = args?.orderBy || 'total_repay_amount DESC, risk DESC';

    let sql = 'SELECT * FROM borrower_status';
    if (Object.keys(filters).length > 0) {
        sql += ' WHERE ' + Object.keys(filters).map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    }
    sql += ` ORDER BY ${orderBy}`;
    return dbClient.query(sql, Object.values(filters))
        .then(r => r.rows).then(rows => rows.map(row => ({
            address: row.address,
            network: row.network,
            ltv: Number(row.ltv),
            health: Number(row.health),
            debt: Number(row.debt),
            collateral: Number(row.collateral),
            risk: Number(row.risk),
            maxRepay: row.max_repay,
            totalRepayAmount: Number(row.total_repay_amount)
        })));
}   
