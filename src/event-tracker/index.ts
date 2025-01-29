import { sleep } from "bun";
import { cvToJSON, hexToCV } from "@stacks/transactions";
import type { TransactionEventSmartContractLog } from "@stacks/stacks-blockchain-api-types";
import type { PoolClient } from "pg";
import { getNetworkNameFromAddress } from "../helper";
import { getContractEvents } from "../hiro-api";
import { pool } from "../db";
import { createLogger } from "../logger";
import { kvStoreGet, kvStoreSet } from "../db/helper";
import type { NetworkName } from "../types";
import { CONTRACTS } from "../constants";

const logger = createLogger("event-tracker");

const TRACKED_CONTRACTS = [
  CONTRACTS.mainnet.borrower,
  CONTRACTS.mainnet.state,
  CONTRACTS.testnet.borrower,
  CONTRACTS.testnet.state,
]

const upsertBorrower = async (dbClient: PoolClient, network: NetworkName, address: string) => {
  const rec = await dbClient.query("SELECT check_flag FROM borrowers WHERE address = $1", [address]).then((r) => r.rows[0]);
  if (!rec) {
    await dbClient.query("INSERT INTO borrowers (address, network) VALUES ($1, $2)", [
      address,
      network,
    ]);
    logger.info(`New borrower ${address}`);
  } else {
    if (rec.check_flag === 0) {
      await dbClient.query("UPDATE borrowers SET check_flag = 1 WHERE address = $1", [address]);
      logger.info(`Borrower ${address} check flag activated`);
    }
  }
}

const processEvents = async (dbClient: PoolClient, network: NetworkName, event: TransactionEventSmartContractLog) => {
  const decoded = hexToCV(event.contract_log.value.hex);
  const json = cvToJSON(decoded);
  const action = json?.value?.action?.value;

  if (["borrow", "add-collateral", "remove-collateral", "deposit", "withdraw"].includes(action)) {
    const user = json.value.user.value;
    await upsertBorrower(dbClient, network, user);
  }

  if (action === "repay") {
    const user = json.value["on-behalf-of"].value || json.value.sender.value;
    await upsertBorrower(dbClient, network, user);
  }

  if (["update-ir-params"].includes(action)) {
    // Update ir params
  }

  if (["update-collateral-settings"].includes(action)) {
    // Update all borrowers under the network to recheck them
  }
}

const syncContract = async (contract: string) => {
  let dbClient = await pool.connect();
  await dbClient.query("BEGIN");
  const key = `borrower-sync-last-tx-seen-${contract}`;
  const lastSeenTx = await kvStoreGet(dbClient, key);
  const network = getNetworkNameFromAddress(contract);

  const limit = 50;
  let offset = 0;
  let lastSeenTxRemote = null;

  while (true) {
    const events = await getContractEvents(
      contract,
      limit,
      offset,
      network
    );

    if (!lastSeenTxRemote && events.results[0]) {
      // The first transaction from the first response
      lastSeenTxRemote = events.results[0].tx_id;
    }

    let breakFlag = false;

    for (const event of events.results) {
      if (event.tx_id === lastSeenTx || breakFlag) {
        breakFlag = true;
        continue;
      }

      if ("contract_log" in event) {
        await processEvents(dbClient, network, event);
      }
    }

    if (events.results.length < limit || breakFlag) {
      break;
    }

    offset += limit;
  }

  if (lastSeenTxRemote) {
    await kvStoreSet(dbClient, key, lastSeenTxRemote);
  }
  await dbClient.query("COMMIT");
  dbClient.release();
}

export const main = async () => {
  while (true) {
    for (const contract of TRACKED_CONTRACTS) {
      await syncContract(contract);
    }
    await sleep(5000);
  }
};
