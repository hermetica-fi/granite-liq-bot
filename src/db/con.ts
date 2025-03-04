import { Database } from "bun:sqlite";

const IS_TEST = process.env.NODE_ENV === 'test';

export const dbCon = new Database(IS_TEST ? ":memory:" : "./data/db.sqlite", { strict: true });