import { getUserCollateralAmount, getUserPosition } from "../../client/read-only-call";
import { getBorrowersToSync, switchBorrowerSyncFlagOff, syncBorrowerCollaterals, syncBorrowerPosition } from "../../dba/borrower";
import { createLogger } from "../../logger";
import { epoch } from "../../util";

export const logger = createLogger("borrower-sync");

const worker = async () => {
  const borrowers = getBorrowersToSync();
  for (const borrower of borrowers) {

    if (epoch() < borrower.syncTs) {
      // logger.info(`Borrower ${borrower.address} is not ready to sync yet`);
      continue;
    }

    // Sync user position
    const userPosition = await getUserPosition(borrower.address);
    syncBorrowerPosition({ address: borrower.address, ...userPosition });

    // Sync user collaterals
    const collaterals = [];
    for (const col of userPosition.collaterals) {
      const amount = await getUserCollateralAmount(borrower.address, col);
      collaterals.push({ collateral: col, amount });
    }
    syncBorrowerCollaterals(borrower.address, collaterals);

    // Turn off check flag
    switchBorrowerSyncFlagOff(borrower.address);

    logger.info(`Synced borrower ${borrower.address}`);
  }
}

export const main = async () => {
  await worker();
};
