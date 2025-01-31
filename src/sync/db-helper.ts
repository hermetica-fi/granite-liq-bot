import type { PoolClient } from "pg";
import type { BorrowerCollateralEntity, BorrowerEntity, BorrowerPositionEntity, BorrowerStatus, NetworkName } from "../types";

export const upsertBorrower = async (dbClient: PoolClient, network: NetworkName, address: string): Promise< 0 | 1 | 2> => {
    const rec = await dbClient.query("SELECT sync_flag FROM borrower WHERE address = $1", [address]).then((r) => r.rows[0]);
    if (!rec) {
        await dbClient.query("INSERT INTO borrower (address, network) VALUES ($1, $2)", [
            address,
            network,
        ]);
        return 1;
    } else {
        if (rec.sync_flag === 0) {
            await dbClient.query("UPDATE borrower SET sync_flag = 1 WHERE address = $1", [address]);
            return 2;
        }
    }
    return 0;
}

export const getBorrowersToSync = async (dbClient: PoolClient): Promise<Pick<BorrowerEntity, 'address' | 'network'>[]> => {
    return dbClient.query("SELECT address, network FROM borrower WHERE sync_flag = 1").then(r => r.rows);
}

export const switchBorrowerSyncFlagOff = async (dbClient: PoolClient, address: string): Promise<any> => {
    return dbClient.query("UPDATE borrower SET sync_flag = 0 WHERE address = $1", [address]);
}

export const syncBorrowerPosition = async (dbClient: PoolClient, userPosition: BorrowerPositionEntity): Promise<any> => {
    await dbClient.query("DELETE FROM borrower_position WHERE address = $1 ", [userPosition.address]);
    return dbClient.query("INSERT INTO borrower_position (address, network, borrowed_amount, borrowed_block, debt_shares, collaterals) VALUES ($1, $2, $3, $4, $5, $6)",
        [userPosition.address, userPosition.network, userPosition.borrowedAmount, userPosition.borrowedBlock, userPosition.debtShares, userPosition.collaterals]);
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
            collaterals: row.collaterals
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
            address, network, health, debt, collateral, risk, liquidate_amt
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
        )`,
        [address, network, status.health.toFixed(4), status.debt.toFixed(4), status.collateral.toFixed(4), status.risk.toFixed(4), status.liquidateAmt.toFixed(4)])
}
