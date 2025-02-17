import { sleep } from "bun";
import { CONTRACTS } from "../constants";
import { main as borrowerSync } from "./borrower-sync";
import { main as contractSync } from "./contract-sync";
import { main as eventSync } from "./event-sync";
import { main as healthSync } from "./health-sync";
import { main as liquidate } from "./liquidate";
import { main as marketSync } from "./market-sync";
const BASE_DELAY = 7_000;

export const main = async () => {
    console.log("--------------------------------");
    console.log("Worker started with contracts:")
    console.log(CONTRACTS); 
    console.log("--------------------------------");
    while (true) {
        const start = Date.now();
        await eventSync();
        await borrowerSync();
        await marketSync();
        await healthSync();
        await contractSync();
        await liquidate();
        const end = Date.now();
        const delay = BASE_DELAY - (end - start);
        if (delay > 0) {
            await sleep(delay)
        }
    }
}