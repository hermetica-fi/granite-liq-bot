import type { PoolClient } from "pg";
import { getUserCollateralAmount, getUserLpShares, getUserPosition } from "../../client/stacks";
import { pool } from "../../db";
import { createLogger } from "../../logger";
import { getBorrowersToSync, syncUserCollaterals, syncUserPosition, updateBorrower } from "./shared";

export const logger = createLogger("borrower-sync");

const worker = async (dbClient: PoolClient) => {
  await dbClient.query("BEGIN");

  const borrowers = await getBorrowersToSync(dbClient);
  for (const borrower of borrowers) {
    const lpShares = await getUserLpShares(borrower.address, borrower.network);

    // Sync lp shares and turn off check flag
    await updateBorrower(dbClient, borrower, lpShares);

    // Sync user position
    const userPosition = await getUserPosition(borrower.address, borrower.network);
    await syncUserPosition(dbClient, { address: borrower.address, ...userPosition });

    // Sync user collaterals
    const collaterals = [];
    for (const col of userPosition.collaterals) {
      const amount = await getUserCollateralAmount(borrower.address, col, borrower.network);
      collaterals.push({ collateral: col, amount });
    }
    await syncUserCollaterals(dbClient, borrower.address, collaterals);

    logger.info(`Synced borrower ${borrower.address}`);
  }

  await dbClient.query("COMMIT");
}

export const main = async () => {
  let dbClient = await pool.connect();
  await worker(dbClient);
  dbClient.release();
};
