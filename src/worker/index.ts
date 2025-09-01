import { CONTRACTS } from "../constants";

import { kvStoreGet, kvStoreSet } from "../db/helper";
import { createLogger } from "../logger";
import { main as borrowerSync } from "./borrower-sync";
import { main as contractSync } from "./contract-sync";
import { main as eventSync } from "./event-sync";
import { main as healthSync } from "./health-sync";
import { main as liquidate } from "./liquidate";
import { main as liquidationPointMapSync } from "./liquidation-point-map";
import { main as marketSync } from "./market-sync";
import { main as usdhSync } from "./usdh-sync";

const BASE_DELAY = 30_000;

const logger = createLogger("event-sync");

const workerInner = async () => {
    const initialSync = !kvStoreGet("last-sync");

    if (initialSync) {
        logger.info("Initial sync is starting. This may take some time.")
    }

    await contractSync();
    await eventSync(initialSync);
    await borrowerSync();
    await marketSync();
    await usdhSync();
    await healthSync();
    await liquidate();
    await liquidationPointMapSync();

    if (initialSync) {
        logger.info("Initial sync is complete.");
    }

    kvStoreSet("last-sync", Date.now());
}

const worker = async () => {
    const start = Date.now();

    await workerInner();

    const end = Date.now();
    const delay = Math.max(1000, BASE_DELAY - (end - start));

    setTimeout(worker, delay);
}

export const main = async () => {
    console.log("--------------------------------");
    console.log("Worker started with contracts:")
    console.log(CONTRACTS);
    console.log("--------------------------------");
    worker();
}