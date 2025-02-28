import type { PoolClient } from "pg";
import { getUserCollateralAmount, getUserPosition } from "../../client/read-only-call";
import { pool } from "../../db";
import { getBorrowersToSync, switchBorrowerSyncFlagOff, syncBorrowerCollaterals, syncBorrowerPosition } from "../../dba/borrower";
import { createLogger } from "../../logger";
import { epoch } from "../../util";

export const logger = createLogger("borrower-sync");

const worker = async (dbClient: PoolClient) => {
  await dbClient.query("BEGIN");

  const borrowers = await getBorrowersToSync(dbClient);
  for (const borrower of borrowers) {

    if (epoch() < borrower.syncTs) {
      // logger.info(`Borrower ${borrower.address} is not ready to sync yet`);
      continue;
    }

    //  Turn off check flag
    await switchBorrowerSyncFlagOff(dbClient, borrower.address);

    // Sync user position
    const userPosition = await getUserPosition(borrower.address, borrower.network);
    await syncBorrowerPosition(dbClient, { address: borrower.address, network: borrower.network, ...userPosition });

    // Sync user collaterals
    const collaterals = [];
    for (const col of userPosition.collaterals) {
      const amount = await getUserCollateralAmount(borrower.address, col, borrower.network);
      collaterals.push({ collateral: col, amount, network: borrower.network });
    }
    await syncBorrowerCollaterals(dbClient, borrower.address, collaterals);

    logger.info(`Synced borrower ${borrower.address}`);
  }

  await dbClient.query("COMMIT");
}

export const main = async () => {
  let dbClient = await pool.connect();
  await worker(dbClient);
  dbClient.release();
};
