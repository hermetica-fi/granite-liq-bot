import { sleep } from "bun";
import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction, principalCV } from "@stacks/transactions";
import type { PoolClient } from "pg";
import { pool } from "../db";
import { createLogger } from "../logger";

import type { NetworkName } from "../types";

const logger = createLogger("borrower-sync");

const STATE_CONTRACTS = {
  "mainnet": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.state-v1",
  "testnet": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.state-v1",
}

const getLpShares = async (address: string, network: NetworkName) => {
  const [contractAddress, contractName] = STATE_CONTRACTS[network].split(".");
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

const getUserPosition = async (address: string, network: NetworkName) => {
  const [contractAddress, contractName] = STATE_CONTRACTS[network].split(".");
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

    return {
      borrowedAmount: json.value.value["borrowed-amount"].value,
      borrowedBlock: json.value.value["borrowed-block"].value,
      debtShares: json.value.value["debt-shares"].value,
      collaterals: json.value.value.collaterals.value.map((c: any) => c.value)
    }
  })
}

const getUserCollateral = async (address: string, collateral: string, network: NetworkName,) => {
  const [contractAddress, contractName] = STATE_CONTRACTS[network].split(".");
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

  const borrowers = await dbClient.query("SELECT address, network FROM borrowers WHERE check_flag = 1 LIMIT 10").then(r => r.rows);
  for (const borrower of borrowers) {
    const lpShares = await getLpShares(borrower.address, borrower.network);
    await dbClient.query("UPDATE borrowers SET lp_shares = $1, check_flag = 0 WHERE address = $2", [lpShares, borrower.address]);

    const userPosition = await getUserPosition(borrower.address, borrower.network);
    if (await dbClient.query("SELECT address FROM user_positions WHERE address = $1", [borrower.address]).then(r => r.rows.length === 0)) {
      await dbClient.query("INSERT INTO user_positions (address, borrowed_amount, borrowed_block, debt_shares, collaterals) VALUES ($1, $2, $3, $4, $5)",
        [borrower.address, userPosition.borrowedAmount, userPosition.borrowedBlock, userPosition.debtShares, userPosition.collaterals]);
      logger.info(`New user position for borrower: ${borrower.address}, borrowed amount: ${userPosition.borrowedAmount}, borrowed block: ${userPosition.borrowedBlock}, debt shares: ${userPosition.debtShares}, collaterals: ${userPosition.collaterals}`);
    } else {
      await dbClient.query("UPDATE user_positions SET borrowed_amount = $1, borrowed_block = $2, debt_shares = $3, collaterals = $4 WHERE address = $5",
        [userPosition.borrowedAmount, userPosition.borrowedBlock, userPosition.debtShares, userPosition.collaterals, borrower.address]);
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
