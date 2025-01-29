
import { main as apiMain } from './api';
import { migrateDb } from './db/migrate';
import { main as eventTrackerMain } from './event-tracker';
import { main as borrowerSyncMain } from './borrower-sync';
import { createLogger } from './logger';
import { waitForDb } from './db';

const logger = createLogger('main');

const main = async () => {
    const cmd = process.argv[process.argv.length - 1];

    let prms: () => Promise<void>;

    if (cmd === "api") {
        prms = apiMain;
    } else if (cmd === "event-tracker") {
        prms = eventTrackerMain;
    } else if (cmd === "borrower-sync") {
        prms = borrowerSyncMain;
    } else {
        throw new Error("Invalid command");
    }

    await waitForDb(60, 2000).catch((e) => {
        logger.error(`Couldn't connect to database`);
        throw e;
    });

    await migrateDb().catch(e => {
        logger.error(`Couldn't migrate database due to: ${e}`);
        throw e;
    });

    await prms();
}


main().catch((e) => {
    logger.error(e.toString());
    process.exit(1);
});
