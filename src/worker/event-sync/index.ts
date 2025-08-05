import type { TransactionEventSmartContractLog } from "@stacks/stacks-blockchain-api-types";
import { cvToJSON, hexToCV } from "@stacks/transactions";
import { getContractEvents } from "../../client/hiro";
import { CONTRACTS } from "../../constants";
import { kvStoreGet, kvStoreSet } from "../../db/helper";
import { upsertBorrower } from "../../dba/borrower";
import { createLogger } from "../../logger";

const logger = createLogger("event-sync");

const TRACKED_CONTRACTS = [
  CONTRACTS.borrower,
  CONTRACTS.state,
  CONTRACTS.liquidator
]

const processEvents = (event: TransactionEventSmartContractLog) => {
  const decoded = hexToCV(event.contract_log.value.hex);
  const json = cvToJSON(decoded);
  const action = json?.value?.action?.value;
  let user = null;

  if (["borrow", "add-collateral", "remove-collateral", "deposit", "withdraw", "liquidate-collateral"].includes(action)) {
    user = json.value.user.value;
  }

  else if (action === "repay") {
    user = json.value["on-behalf-of"].value || json.value.sender.value;

    if (typeof user === 'object') {
      user = user.value;
    }
  }

  if (user) {
    const r = upsertBorrower(user);
    if (r === 1) {
      logger.info(`New borrower ${user}`);
    }
    else if (r === 2) {
      logger.info(`Borrower ${user} check sync activated`);
    }
  }
}

const worker = async (contract: string) => {
  const key = `borrower-sync-last-tx-seen-${contract}`;
  const lastSeenTx = kvStoreGet(key);

  const limit = 50;
  let offset = 0;
  let lastSeenTxRemote: string | null = null;

  const fetchEvents = async () => {
    const events = await getContractEvents(
      contract,
      limit,
      offset,
      'mainnet'
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
        processEvents(event);
      }
    }

    if (events.results.length < limit || breakFlag) {
      return;
    }

    offset += limit;

    await fetchEvents();
  }

  await fetchEvents();

  if (lastSeenTxRemote) {
    kvStoreSet(key, lastSeenTxRemote);
  }
}

export const main = async () => {
  for (const contract of TRACKED_CONTRACTS) {
    await worker(contract);
  }
};
