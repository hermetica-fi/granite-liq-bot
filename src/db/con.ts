import { Database } from "bun:sqlite";
import fs from "fs";

const IS_TEST = process.env.NODE_ENV === 'test';

if(!fs.existsSync("./data")) {
    fs.mkdirSync("./data", { recursive: true });
}

export const dbCon = new Database(IS_TEST ? ":memory:" : "./data/db.sqlite", { strict: true });