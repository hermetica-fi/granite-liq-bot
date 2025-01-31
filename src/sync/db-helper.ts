import type { PoolClient } from "pg";
import type { BorrowerCollateralEntity, BorrowerEntity, BorrowerPositionEntity, NetworkName } from "../types";

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