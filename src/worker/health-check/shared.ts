import type { PoolClient } from "pg";

export const getBorrowersForHealthCheck = async (dbClient: PoolClient): Promise<{ address: string, network: string, debtShares: number, collaterals: string[] }[]> => {
    return dbClient.query("SELECT b.address, b.network, u.debt_shares, u.collaterals FROM user_positions u LEFT OUTER JOIN borrowers b ON u.address=b.address").then(r => r.rows).then(rows => (
        rows.map(row => ({
            address: row.address,
            network: row.network,
            debtShares: Number(row.debt_shares),
            collaterals: row.collaterals
        }))
    ))
}

export const getUserCollateralAmount = async (dbClient: PoolClient, address: string, collateral: string): Promise<number | undefined> => {
    return dbClient.query("SELECT amount FROM user_collaterals WHERE address=$1 AND collateral=$2", [address, collateral]).then(r => r.rows[0] ? Number(r.rows[0].amount) : undefined)
}

export const updateBorrowerHealth = async (dbClient: PoolClient, address: string, health: number) => {
    return dbClient.query("UPDATE borrowers SET health=$1 WHERE address=$2", [health, address])
}
    
export const calcAccountHealth = () => {

}