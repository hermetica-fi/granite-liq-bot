import type { PoolClient } from "pg";
import type { BorrowerStatus, NetworkName } from "../../types";

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