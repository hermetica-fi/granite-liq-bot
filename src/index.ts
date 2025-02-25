import { main as apiMain } from './api';
import { waitForDb } from './db';
import { migrateDb } from './db/migrate';
import { createLogger } from './logger';
import { main as workerMain } from './worker';

const logger = createLogger('main');

await waitForDb(60, 2000).catch((e) => {
    logger.error(`Couldn't connect to database`);
    throw e;
});

await migrateDb().catch(e => {
    logger.error(`Couldn't migrate database due to: ${e}`);
    throw e;
});

apiMain();
workerMain();