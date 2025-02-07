import assert from "assert";
import type { NetworkName } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { fetchAndProcessPriceFeed } from "../../client/pyth";
import { pool } from "../../db";
import { clearBorrowerStatuses, getBorrowerCollateralAmount, getBorrowersForHealthCheck, getMarketState, insertBorrowerStatus } from "../db-helper";
import { calcBorrowerStatus } from "./shared";

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

    const priceFeed = await fetchAndProcessPriceFeed();

    const status = calcBorrowerStatus({
      debtShares: borrower.debtShares,
      collateralsDeposited
    }, marketState, priceFeed);

    await insertBorrowerStatus(dbClient, borrower.address, network, status);
  }
  await dbClient.query("COMMIT");
};

export const main = async () => {
  let dbClient = await pool.connect();
  await worker(dbClient);
  dbClient.release();
}


