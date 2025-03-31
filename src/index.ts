import { main as apiMain } from './api';
import { migrateDb } from './db/migrate';
import { onStart } from './hooks';
import { createLogger } from './logger';
import { main as workerMain } from './worker';

const logger = createLogger('main');

migrateDb();
apiMain();
workerMain();
onStart();