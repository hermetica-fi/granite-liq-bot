import type { PoolClient } from "pg";
import type { Borrower, DbOpRs, UserPosition } from "../types";

type PartialBorrower = Pick<Borrower, 'address' | 'network'>;

export const getBorrowersToSync = async (dbClient: PoolClient): Promise<PartialBorrower[]> => {
    return dbClient.query("SELECT address, network FROM borrowers WHERE check_flag = 1 LIMIT 10").then(r => r.rows);
}

export const updateBorrower = async (dbClient: PoolClient, borrower: PartialBorrower, lpShares: string): Promise<any> => {
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

export const upsertUserPosition = async (dbClient: PoolClient, userPosition: UserPosition): Promise<DbOpRs  > => {
    if (await userHasPosition(dbClient, userPosition.address)) {
        await updateUserPosition(dbClient, userPosition);
        return 2;
    } else {
        await insertUserPosition(dbClient, userPosition);
        return 1;
    }

    return 0;
}