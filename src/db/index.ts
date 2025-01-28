require("dotenv").config();

import {assertEnvVars} from "../util";
import {createLogger} from '../logger';

const [DB] = assertEnvVars("DB");

const logger = createLogger('db');

import {Pool} from "pg";
import type {QueryResultRow} from "pg";
import { sleep } from "bun";

export const pool = new Pool({
    connectionString: DB,
    max: 200
});

export const dbQuery = (text: string, values: any[]): Promise<QueryResultRow> => {
    return new Promise((resolve, reject) => {
        pool.query(text, values, (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(res);
        })
    })
}

export const waitForDb = async (maxRetry: number, retryDelay: number) => {
    let retry = 1;
    while (true) {
        try {
            await dbQuery('SELECT 1', []);
            break;
        } catch (e) {
            logger.info('Waiting for database connection...');
            await sleep(retryDelay);
        }

        if (retry === maxRetry) {
            throw new Error('Could not connect to database');
        }

        retry++;
    }
}

export const testDb = () => dbQuery("SELECT 1", []);