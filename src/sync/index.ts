import { sleep } from "bun";
import { epoch } from "../util";
import { main as borrowerSync } from "./borrower";
import { main as eventSync } from "./event";
import { main as healthSync } from "./health";
import { main as marketSync } from "./market";

export const main = async () => {
    while (true) {
        console.log("Syncing...")
        const start = epoch();
        await eventSync();
        await borrowerSync();
        await marketSync();
        await healthSync();
        const end = epoch()
        const delay = 10 - (end - start);
        if(delay > 0){
            console.log(`Sleeping for ${delay}ms`)
            await sleep(delay)
        }
    }
}