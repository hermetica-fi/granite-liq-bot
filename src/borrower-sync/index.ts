import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction, principalCV } from "@stacks/transactions";
import { sleep } from "bun";
import type { PoolClient } from "pg";
import { pool } from "../db";
import { createLogger } from "../logger";

import { CONTRACTS } from "../constants";
import type { NetworkName, UserPosition } from "../types";
import { getBorrowersToSync, updateBorrower, upsertUserPosition } from "./shared";

const logger = createLogger("borrower-sync");

const getLpShares = async (address: string, network: NetworkName) => {
  const [contractAddress, contractName] = CONTRACTS[network].borrower.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-balance",
    functionArgs: [
      principalCV(address),
    ],
    senderAddress: address,
    network
  }).then(r => {
    return cvToJSON(r).value.value;
  })
}

const getUserPosition = async (address: string, network: NetworkName): Promise<Pick<UserPosition, 'borrowedAmount' | 'borrowedBlock' | 'debtShares' | 'collaterals'>> => {
  const [contractAddress, contractName] = CONTRACTS[network].borrower.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-user-position",
    functionArgs: [
      principalCV(address),
    ],
    senderAddress: address,
    network
  }).then(r => {
    const json = cvToJSON(r);

    if (json.value === null) {
      return {
        borrowedAmount: 0,
        borrowedBlock: 0,
        debtShares: 0,
        collaterals: []
      }
    };

    return {
      borrowedAmount: json.value.value["borrowed-amount"].value,
      borrowedBlock: json.value.value["borrowed-block"].value,
      debtShares: json.value.value["debt-shares"].value,
      collaterals: json.value.value.collaterals.value.map((c: any) => c.value)
    }
  })
}

const getUserCollateral = async (address: string, collateral: string, network: NetworkName,) => {
  const [contractAddress, contractName] = CONTRACTS[network].borrower.split(".");
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-user-collateral",
    functionArgs: [
      principalCV(address),
      contractPrincipalCV(collateral.split(".")[0], collateral.split(".")[1])
    ],
    senderAddress: address,
    network
  }).then(r => {
    const json = cvToJSON(r);
    return json.value.value.amount.value;
  })
}

const worker = async (dbClient: PoolClient) => {
  await dbClient.query("BEGIN");

  const borrowers = await getBorrowersToSync(dbClient);
  for (const borrower of borrowers) {
    const lpShares = await getLpShares(borrower.address, borrower.network);
    await updateBorrower(dbClient, borrower, lpShares);

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
  

    for (const col of userPosition.collaterals) {
      const amount = await getUserCollateral(borrower.address, col, borrower.network);
      if (await dbClient.query("SELECT address, collateral FROM user_collaterals WHERE address = $1 AND collateral = $2", [borrower.address, col]).then(r => r.rows.length === 0)) {
        await dbClient.query("INSERT INTO user_collaterals (address, collateral, amount) VALUES ($1, $2, $3)", [borrower.address, col, amount]);
        logger.info(`New user collateral for ${borrower.address} collateral: ${col}, amount: ${amount}`);
      } else {
        await dbClient.query("UPDATE user_collaterals SET amount = $1 WHERE address = $2 AND collateral = $3", [amount, borrower.address, col]);
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
