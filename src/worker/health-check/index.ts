import assert from "assert";
import { sleep } from "bun";
import type { PoolClient } from "pg";
import { pool } from "../../db";
import type { NetworkName } from "../../types";
import { getMarketState } from "../market-sync/shared";
import { calcBorrowerStatus } from "./lib";
import { getBorrowersForHealthCheck, getUserCollateralAmount, upsertBorrowerStatus } from "./shared";

export const worker = async (dbClient: PoolClient) => {
  dbClient.query("BEGIN");
  const borrowers = await getBorrowersForHealthCheck(dbClient);
  for (const borrower of borrowers) {
    const marketState = await getMarketState(dbClient, borrower.network as NetworkName);
    if (!marketState) {
      throw new Error("No market state found");
    }

    if(borrower.debtShares === 0){
      await upsertBorrowerStatus(dbClient, borrower.address, null);
      continue;
    }

    const collateralsDeposited: Record<string, number> = {}
    for (const collateral of borrower.collaterals) {
      const amount = await getUserCollateralAmount(dbClient, borrower.address, collateral);
      assert(amount !== undefined, "User collateral amount is undefined");
      collateralsDeposited[collateral] = amount;
    }

    const status = calcBorrowerStatus({
      debtShares: borrower.debtShares,
      collateralsDeposited
    }, marketState);

    await upsertBorrowerStatus(dbClient, borrower.address, status);
  }
  await dbClient.query("COMMIT");
};


export const main = async () => {
  const dbClient = await pool.connect();
  while (true) {
    await worker(dbClient);
    await sleep(2000);
  }
}