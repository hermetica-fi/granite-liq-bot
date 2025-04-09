import { main as apiMain } from './api';
import { migrateDb } from './db/migrate';
import { onExit, onStart } from './hooks';
import { main as workerMain } from './worker';

migrateDb();
const server = await apiMain();
workerMain();
onStart();

const signalHandler = async () => {
    server.stop();
    await onExit();
    process.exit();
}

process.on('SIGINT', signalHandler);
process.on('SIGTERM', signalHandler);
process.on('SIGQUIT', signalHandler);

process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    server.stop();
    await onExit(String(err));
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.stop();
    await onExit(String(reason));
    process.exit(1);
});