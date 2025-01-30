import { sleep } from "bun";
import type { PoolClient } from "pg";
import { getUserCollateralAmount, getUserLpShares, getUserPosition } from "../client/stacks";
import { pool } from "../db";
import { createLogger } from "../logger";
import { getBorrowersToSync, updateBorrower, upsertUserCollateral, upsertUserPosition } from "./shared";

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
    const r = await upsertUserPosition(dbClient, {
      address: borrower.address,
      ...userPosition
    });
    if (r === 1) {
      logger.info(`New user position for borrower: ${borrower.address}, borrowed amount: ${userPosition.borrowedAmount}, borrowed block: ${userPosition.borrowedBlock}, debt shares: ${userPosition.debtShares}, collaterals: ${userPosition.collaterals}`);
    }
    else if (r === 2) {
      logger.info(`Updated user position for ${borrower.address} borrowed amount: ${userPosition.borrowedAmount}, borrowed block: ${userPosition.borrowedBlock}, debt shares: ${userPosition.debtShares}, collaterals: ${userPosition.collaterals}`);
    }

    // Sync user collaterals
    for (const col of userPosition.collaterals) {
      const amount = await getUserCollateralAmount(borrower.address, col, borrower.network);
      const r = await upsertUserCollateral(dbClient, {
        address: borrower.address,
        collateral: col,
        amount
      });
      if (r === 1) {
        logger.info(`New user collateral for ${borrower.address} collateral: ${col}, amount: ${amount}`);
      } else if (r === 2) {
        logger.info(`Updated borrower collateral for ${borrower.address} collateral: ${col}, amount: ${amount}`);
      }
    }

    logger.info(`Synced borrower ${borrower.address}`);
  }

  await dbClient.query("COMMIT");
}

export const main = async () => {
  let dbClient = await pool.connect();
  while (true) {
    await worker(dbClient);
    await sleep(5000);
  }
};
