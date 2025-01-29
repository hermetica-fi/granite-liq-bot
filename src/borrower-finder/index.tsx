import type { StacksNetwork, StacksNetworkName } from "@stacks/network";
import { networkFromName } from "@stacks/network";
import { cvToJSON, hexToCV } from "@stacks/transactions";
import type { TransactionEvent } from "@stacks/stacks-blockchain-api-types";
import { sleep } from "bun";
import { getNetworkNameFromAddress } from "../helper";
import { getContractEvents } from "../hiro-api";
import { pool } from "../db";
import { createLogger } from "../logger";

/*

const MULTI_CALL_MAINNET = "SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7.g-multi"
const MULTI_CALL_TESTNET = "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK.g-multi"

const STATE_CONTRACTS = [
  "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.borrower-v1",
  "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.state-v1",
];
*/

// const MULTI_CALL = "SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7.g-multi";

const logger = createLogger("borrower-finder");

const BORROWER_CONTRACTS = [
  "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.borrower-v1",
  "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.borrower-v1",
];

const syncBorrowers = async (borrowers: string[]) => {
  let dbClient = await pool.connect();
  await dbClient.query("BEGIN");
  for (const address of borrowers) {
    if (
      await dbClient
        .query("SELECT * FROM borrowers WHERE address = $1", [address])
        .then((r) => r.rows.length === 0)
    ) {
      await dbClient.query("INSERT INTO borrowers (address) VALUES ($1)", [
        address,
      ]);
      logger.info(`New borrower ${address}`);
    }
  }
  await dbClient.query("COMMIT");
  dbClient.release();
};

const getAllEvents = async (contract: string, network: StacksNetwork) => {
  const limit = 50;
  let offset = 0;
  const allEvents: TransactionEvent[] = [];

  while (true) {
    const events = await getContractEvents(contract, limit, offset, network);
    if (events.results.length === 0) {
      break;
    }

    for (const event of events.results) {
      allEvents.push(event);
    }

    offset += limit;
  }

  return allEvents;
};

const getRecentEvents = async (contract: string, network: StacksNetwork) =>
  getContractEvents(contract, 0, 50, network).then((r) => r.results);

const eventsToBorrowers = (events: TransactionEvent[]) => {
  const users: string[] = [];
  for (const event of events) {
    if ("contract_log" in event) {
      const decoded = hexToCV(event.contract_log.value.hex);
      const json = cvToJSON(decoded);
      if (json?.value?.action?.value === "borrow") {
        const user = json?.value?.user?.value;
        if (users.indexOf(user) === -1) {
          users.push(user);
        }
      }
    }
  }

  return users;
};

const fullSync = async (contract: string) => {
  const networkName = getNetworkNameFromAddress(contract);
  const network = networkFromName(networkName);
  const events = await getAllEvents(contract, network);
  const borrowers = eventsToBorrowers(events);
  await syncBorrowers(borrowers);
};

const partialSync = async (contract: string) => {
  const networkName = getNetworkNameFromAddress(contract);
  const network = networkFromName(networkName);
  const recentEvents = await getRecentEvents(contract, network);
  const borrowers = eventsToBorrowers(recentEvents);
  await syncBorrowers(borrowers);
  await sleep(5000);
};

export const main = async () => {
  for (const contract of BORROWER_CONTRACTS) {
    await fullSync(contract);
  }

  while (true) {
    for (const contract of BORROWER_CONTRACTS) {
      await partialSync(contract);
    }
    await sleep(5000);
  }
};
