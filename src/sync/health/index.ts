import assert from "assert";
import type { PoolClient } from "pg";
import { pool } from "../../db";
import { calcBorrowerStatus } from "../../shared";
import type { NetworkName } from "../../types";
import { clearBorrowerStatuses, getBorrowerCollateralAmount, getBorrowersForHealthCheck, getMarketState, insertBorrowerStatus } from "../db-helper";

export const worker = async (dbClient: PoolClient) => {
  await dbClient.query("BEGIN");
  await clearBorrowerStatuses(dbClient);
  const borrowers = await getBorrowersForHealthCheck(dbClient);
  for (const borrower of borrowers) {
    const network = borrower.network as NetworkName
    const marketState = await getMarketState(dbClient, borrower.network as NetworkName);

    if (borrower.debtShares === 0) {
      continue;
    }

    const collateralsDeposited: Record<string, number> = {}
    for (const collateral of borrower.collaterals) {
      const amount = await getBorrowerCollateralAmount(dbClient, borrower.address, collateral);
      assert(amount !== undefined, "User collateral amount is undefined");
      collateralsDeposited[collateral] = amount;
    }

    const status = calcBorrowerStatus({
      debtShares: borrower.debtShares,
      collateralsDeposited
    }, marketState);

    await insertBorrowerStatus(dbClient, borrower.address, network, status);
  }
  await dbClient.query("COMMIT");
};

export const main = async () => {
  let dbClient = await pool.connect();
  await worker(dbClient);
  dbClient.release();
}


