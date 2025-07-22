import { CONTRACTS } from "../constants";

import { kvStoreSet } from "../db/helper";
import { main as borrowerSync } from "./borrower-sync";
import { main as contractSync } from "./contract-sync";
import { main as eventSync } from "./event-sync";
import { main as healthSync } from "./health-sync";
import { main as liquidate } from "./liquidate";
import { main as liquidationPointMapSync } from "./liquidation-point-map";
import { main as marketSync } from "./market-sync";
import { main as usdhSync } from "./usdh-sync";

const BASE_DELAY = 30_000;

const workerInner = async () => {
    await contractSync();
    await eventSync();
    await borrowerSync();
    await marketSync();
    await usdhSync();
    await healthSync();
    await liquidate();
    await liquidationPointMapSync();

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