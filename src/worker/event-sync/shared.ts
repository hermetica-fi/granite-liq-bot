import type { PoolClient } from "pg";
import type { DbOpRs, NetworkName } from "../../types";

export const upsertBorrower = async (dbClient: PoolClient, network: NetworkName, address: string): Promise<DbOpRs> => {
    const rec = await dbClient.query("SELECT check_flag FROM borrowers WHERE address = $1", [address]).then((r) => r.rows[0]);
    if (!rec) {
        await dbClient.query("INSERT INTO borrowers (address, network) VALUES ($1, $2)", [
            address,
            network,
        ]);
        return 1;
    } else {
        if (rec.check_flag === 0) {
            await dbClient.query("UPDATE borrowers SET check_flag = 1 WHERE address = $1", [address]);
            return 2;
        }
    }
    return 0
}