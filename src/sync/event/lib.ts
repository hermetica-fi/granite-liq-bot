import type { PoolClient } from "pg";
import type { NetworkName } from "../../types";

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