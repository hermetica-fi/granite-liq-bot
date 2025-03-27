import { dbCon } from "../db/con";
import { epoch } from "../util";

export const insertLiquidation = (txid: string, contract: string) => {
    dbCon.run(`INSERT INTO liquidation (txid, contract, created_at) VALUES (?, ?, ?)`, [txid, contract, epoch()]);
}

export const finalizeLiquidation = (txid: string, status: string) => {
    dbCon.run("UPDATE liquidation SET status = ?, updated_at = ? WHERE txid = ?", [status, epoch(), txid]);
}