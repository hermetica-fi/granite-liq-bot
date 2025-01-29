import type { PoolClient } from "pg";
import type { MarketState, NetworkName } from "../types";
import { kvStoreGet, kvStoreSet } from "../db/helper";

export const getMarketState = async (dbClient: PoolClient, network: NetworkName): Promise<MarketState | null> => {
    return await kvStoreGet(dbClient, `market-state-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}   

export const setMarketState = async (dbClient: PoolClient, network: NetworkName, marketState: MarketState) => {
    await kvStoreSet(dbClient, `market-state-${network}`, JSON.stringify(marketState));
}