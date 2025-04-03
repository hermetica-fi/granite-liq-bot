import { main as apiMain } from './api';
import { migrateDb } from './db/migrate';
import { onExit, onStart } from './hooks';
import { createLogger } from './logger';
import { main as workerMain } from './worker';

const logger = createLogger('main');

migrateDb();
apiMain();
workerMain();
onStart();

const signalHandler = async () => {
    await onExit();
    process.exit();
}

process.on('SIGINT', signalHandler);
process.on('SIGTERM', signalHandler);
process.on('SIGQUIT', signalHandler);

process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    await onExit(String(err));
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await onExit(String(reason));
    process.exit(1);
});