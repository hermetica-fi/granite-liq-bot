import { sleep } from "bun";
import { cvToJSON, fetchCallReadOnlyFunction, hexToCV, principalCV } from "@stacks/transactions";
import type { TransactionEventSmartContractLog } from "@stacks/stacks-blockchain-api-types";
import type { PoolClient } from "pg";
import type { StacksNetworkName } from "@stacks/network";
import { getNetworkNameFromAddress } from "../helper";
import { getContractEvents } from "../hiro-api";
import { pool } from "../db";
import { createLogger } from "../logger";
import { kvStoreGet, kvStoreSet } from "../db/helper";

const logger = createLogger("borrower-sync");

const STATE_CONTRACTS = {
  "mainnet": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.state-v1",
  "testnet": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.state-v1",
}

const getLpShares = async (address: string, network: StacksNetworkName) => {
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
    console.log(cvToJSON(r).value.value);
  })
}

const worker = async (dbClient: PoolClient) => {
  const borrowers = await dbClient.query("SELECT address, network FROM borrowers WHERE check_flag = 1 LIMIT 10").then(r => r.rows);
  for (const borrower of borrowers) {
    await getLpShares(borrower.address, borrower.network as StacksNetworkName);
  }
  //await dbClient.query("BEGIN");

  //await dbClient.query("COMMIT");

}

export const main = async () => {
  let dbClient = await pool.connect();
  while (true) {
    await worker(dbClient);
    await sleep(5000);
  }
};
