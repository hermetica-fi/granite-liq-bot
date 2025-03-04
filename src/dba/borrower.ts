import type { BorrowerStatus, NetworkName } from "granite-liq-bot-common";
import { type BorrowerStatusEntity } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { BORROWER_SYNC_DELAY } from "../constants";
import type {
    BorrowerCollateralEntity, BorrowerEntity,
    BorrowerPositionEntity
} from "../types";
import { epoch } from "../util";

export const upsertBorrower = async (dbClient: PoolClient, network: NetworkName, address: string): Promise<0 | 1 | 2> => {
    const rec = await dbClient.query("SELECT sync_flag FROM borrower WHERE address = $1", [address]).then((r) => r.rows[0]);
    // wait some time before syncing to make sure blockchain data settled
    const syncTs = epoch() + BORROWER_SYNC_DELAY;
    if (!rec) {
        await dbClient.query("INSERT INTO borrower (address, network, sync_flag, sync_ts) VALUES ($1, $2, $3, $4)", [
            address,
            network,
            1,
            syncTs
        ]);
        return 1;
    } else {
        if (rec.sync_flag === 0) {
            await dbClient.query("UPDATE borrower SET sync_flag = 1, sync_ts=$1 WHERE address = $2", [syncTs, address]);
            return 2;
        }
    }
    return 0;
}



export const getBorrowersToSync = async (dbClient: PoolClient): Promise<BorrowerEntity[]> => {
    return dbClient.query("SELECT address, network, sync_ts FROM borrower WHERE sync_flag = 1").then(r => r.rows.map(x => ({
        address: x.address,
        network: x.network,
        syncTs: x.sync_ts
    })));
}

export const switchBorrowerSyncFlagOff = async (dbClient: PoolClient, address: string): Promise<any> => {
    return dbClient.query("UPDATE borrower SET sync_flag = 0, sync_ts = 0 WHERE address = $1", [address]);
}

export const syncBorrowerPosition = async (dbClient: PoolClient, userPosition: BorrowerPositionEntity): Promise<any> => {
    await dbClient.query("DELETE FROM borrower_position WHERE address = $1 ", [userPosition.address]);
    return dbClient.query("INSERT INTO borrower_position (address, network, debt_shares, collaterals) VALUES ($1, $2, $3, $4)",
        [userPosition.address, userPosition.network, userPosition.debtShares, JSON.stringify(userPosition.collaterals)]);
}

export const syncBorrowerCollaterals = async (dbClient: PoolClient, address: string, collaterals: Omit<BorrowerCollateralEntity, 'address'>[]): Promise<any> => {
    await dbClient.query("DELETE FROM borrower_collaterals WHERE address = $1", [address]);

    for (const collateral of collaterals) {
        await dbClient.query("INSERT INTO borrower_collaterals (address, network, collateral, amount) VALUES ($1, $2, $3, $4)",
            [address, collateral.network, collateral.collateral, collateral.amount]);
    }
}

export const getBorrowersForHealthCheck = async (dbClient: PoolClient): Promise<{ address: string, network: string, debtShares: number, collaterals: string[] }[]> => {
    return dbClient.query("SELECT address, network, debt_shares, collaterals FROM borrower_position").then(r => r.rows).then(rows => (
        rows.map(row => ({
            address: row.address,
            network: row.network,
            debtShares: Number(row.debt_shares),
            collaterals: JSON.parse(row.collaterals)
        }))
    ))
}

export const getBorrowerCollateralAmount = async (dbClient: PoolClient, address: string, collateral: string): Promise<number | undefined> => {
    return dbClient.query("SELECT amount FROM borrower_collaterals WHERE address=$1 AND collateral=$2", [address, collateral]).then(r => r.rows[0] ? Number(r.rows[0].amount) : undefined)
}

export const clearBorrowerStatuses = async (dbClient: PoolClient) => {
    await dbClient.query("DELETE FROM borrower_status");
}

export const insertBorrowerStatus = async (dbClient: PoolClient, address: string, network: NetworkName, status: BorrowerStatus) => {
    return dbClient.query(
        `INSERT INTO borrower_status (
            address, network, ltv, health, debt, collateral, risk, max_repay, total_repay_amount
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        )`,
        [address, network, status.ltv.toFixed(4), status.health.toFixed(4), status.debt.toFixed(4), status.collateral.toFixed(4), status.risk.toFixed(4), status.maxRepay, status.totalRepayAmount])
}

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
