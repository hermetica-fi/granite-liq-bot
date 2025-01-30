import type { PoolClient } from "pg";
import type { Borrower, DbOpRs, UserCollateral, UserPosition } from "../types";

type PartialBorrower = Pick<Borrower, 'address' | 'network'>;

export const getBorrowersToSync = async (dbClient: PoolClient): Promise<PartialBorrower[]> => {
    return dbClient.query("SELECT address, network FROM borrowers WHERE check_flag = 1 LIMIT 10").then(r => r.rows);
}

export const updateBorrower = async (dbClient: PoolClient, borrower: PartialBorrower, lpShares: number): Promise<any> => {
    return dbClient.query("UPDATE borrowers SET lp_shares = $1, check_flag = 0 WHERE address = $2", [lpShares, borrower.address]);
}

export const userHasPosition = async (dbClient: PoolClient, address: string): Promise<boolean> => {
    return dbClient.query("SELECT address FROM user_positions WHERE address = $1", [address]).then(r => r.rows.length === 0)
}

const insertUserPosition = async (dbClient: PoolClient, userPosition: UserPosition): Promise<any> => {
    return dbClient.query("INSERT INTO user_positions (address, borrowed_amount, borrowed_block, debt_shares, collaterals) VALUES ($1, $2, $3, $4, $5)",
        [userPosition.address, userPosition.borrowedAmount, userPosition.borrowedBlock, userPosition.debtShares, userPosition.collaterals]);
}

const updateUserPosition = async (dbClient: PoolClient, userPosition: UserPosition): Promise<any> => {
    await dbClient.query("UPDATE user_positions SET borrowed_amount = $1, borrowed_block = $2, debt_shares = $3, collaterals = $4 WHERE address = $5",
        [userPosition.borrowedAmount, userPosition.borrowedBlock, userPosition.debtShares, userPosition.collaterals, userPosition.address]);
}

export const upsertUserPosition = async (dbClient: PoolClient, userPosition: UserPosition): Promise<DbOpRs> => {
    if (await userHasPosition(dbClient, userPosition.address)) {
        await updateUserPosition(dbClient, userPosition);
        return 2;
    } else {
        await insertUserPosition(dbClient, userPosition);
        return 1;
    }
}

type PartialUserCollateral = Pick<UserCollateral, 'address' | 'collateral' | 'amount'>;

const userHasCollateral = async (dbClient: PoolClient, address: string, collateral: string): Promise<boolean> => {
    return dbClient.query("SELECT address FROM user_collaterals WHERE address = $1 AND collateral = $2", [address, collateral]).then(r => r.rows.length === 0)
}

const insertUserCollateral = async (dbClient: PoolClient, userCollateral: PartialUserCollateral): Promise<any> => {
    return dbClient.query("INSERT INTO user_collaterals (address, collateral, amount) VALUES ($1, $2, $3)", [userCollateral.address, userCollateral.collateral, userCollateral.amount]);
}

const updateUserCollateral = async (dbClient: PoolClient, userCollateral: PartialUserCollateral): Promise<any> => {
    return dbClient.query("UPDATE user_collaterals SET amount = $1 WHERE address = $2 AND collateral = $3", [userCollateral.amount, userCollateral.address, userCollateral.collateral]);
}

export const upsertUserCollateral = async (dbClient: PoolClient, userCollateral: PartialUserCollateral): Promise<DbOpRs> => {
    if (await userHasCollateral(dbClient, userCollateral.address, userCollateral.collateral)) {
        await updateUserCollateral(dbClient, userCollateral);
        return 2;
    } else {
        await insertUserCollateral(dbClient, userCollateral);
        return 1;
    }
}