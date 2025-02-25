import { CONTRACTS } from "../constants";
import { pool } from "../db";
import { kvStoreSet } from "../db/helper";
import { createLogger } from "../logger";
import { main as borrowerSync } from "./borrower-sync";
import { main as contractSync } from "./contract-sync";
import { main as eventSync } from "./event-sync";
import { main as healthSync } from "./health-sync";
import { main as liquidate } from "./liquidate";
import { main as marketSync } from "./market-sync";

const BASE_DELAY = 7_000;

const logger = createLogger('worker');

const workerInner = async () => {
    await contractSync();
    await eventSync();
    await borrowerSync();
    await marketSync();
    await healthSync();
    await liquidate();

    const dbClient = await pool.connect();
    await kvStoreSet(dbClient, "last-sync", Date.now());
    dbClient.release();
}

const worker = async () => {
    const start = Date.now();

    await workerInner().catch((e) => {
        logger.error(e.toString());
        process.exit(1);
    });

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