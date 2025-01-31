import { sleep } from "bun";
import { main as borrowerSync } from "./borrower";
import { main as eventSync } from "./event";
import { main as healthSync } from "./health";
import { main as marketSync } from "./market";

const BASE_DELAY = 10_000;

export const main = async () => {
    while (true) {
        const start = Date.now();
        await eventSync();
        await borrowerSync();
        await marketSync();
        await healthSync();
        const end = Date.now();
        const delay = BASE_DELAY - (end - start);
        if(delay > 0){
            await sleep(delay)
        }
    }
}