import type { PoolClient } from "pg";
import { kvStoreGet, kvStoreSet } from "../db/helper";
import type { MarketState, NetworkName } from "../types";

export const getMarketState = async (dbClient: PoolClient, network: NetworkName): Promise<MarketState | null> => {
    return await kvStoreGet(dbClient, `market-state-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}

export const setMarketState = async (dbClient: PoolClient, network: NetworkName, marketState: MarketState) => {
    await kvStoreSet(dbClient, `market-state-${network}`, JSON.stringify(marketState));
}

export const getDistinctCollateralList = async (dbClient: PoolClient): Promise<string[]> => {
    return dbClient.query("SELECT collateral FROM user_collaterals GROUP BY collateral").then(r => r.rows.map(r => r.collateral));
}