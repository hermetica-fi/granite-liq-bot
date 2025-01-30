import type { PoolClient } from "pg";
import type { Borrower, UserCollateral, UserPosition } from "../../types";

type PartialBorrower = Pick<Borrower, 'address' | 'network'>;

export const getBorrowersToSync = async (dbClient: PoolClient): Promise<PartialBorrower[]> => {
    return dbClient.query("SELECT address, network FROM borrowers WHERE check_flag = 1 LIMIT 10").then(r => r.rows);
}

export const updateBorrower = async (dbClient: PoolClient, borrower: PartialBorrower, lpShares: number): Promise<any> => {
    return dbClient.query("UPDATE borrowers SET lp_shares = $1, check_flag = 0 WHERE address = $2", [lpShares, borrower.address]);
}

export const syncUserPosition = async (dbClient: PoolClient, userPosition: UserPosition): Promise<any> => {
    await dbClient.query("DELETE FROM user_positions WHERE address = $1 ", [userPosition.address]);
    return dbClient.query("INSERT INTO user_positions (address, borrowed_amount, borrowed_block, debt_shares, collaterals) VALUES ($1, $2, $3, $4, $5)",
        [userPosition.address, userPosition.borrowedAmount, userPosition.borrowedBlock, userPosition.debtShares, userPosition.collaterals]);
}

type PartialUserCollateral = Pick<UserCollateral, 'collateral' | 'amount'>;

export const syncUserCollaterals = async (dbClient: PoolClient, address: string, userCollaterals: PartialUserCollateral[]): Promise<any> => {
    await dbClient.query("DELETE FROM user_collaterals WHERE address = $1", [address]);

    for (const userCollateral of userCollaterals) {
        await dbClient.query("INSERT INTO user_collaterals (address, collateral, amount) VALUES ($1, $2, $3)", [address, userCollateral.collateral, userCollateral.amount]);
    }
}