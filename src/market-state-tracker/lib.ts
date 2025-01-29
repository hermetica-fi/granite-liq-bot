import type { PoolClient } from "pg";
import type { NetworkName } from "../types";
import { kvStoreGet, kvStoreSet } from "../db/helper";
import type { InterestRateParams, LpParams, AccrueInterestParams } from "../types";

export const setIrParams = async (dbClient: PoolClient, network: NetworkName, params: InterestRateParams) => {
    await kvStoreSet(dbClient, `ir-params-${network}`, JSON.stringify(params));
}

export const setLpParams = async (dbClient: PoolClient, network: NetworkName, params: LpParams) => {
    await kvStoreSet(dbClient, `lp-params-${network}`, JSON.stringify(params));
}

export const setAccrueInterestParams = async (dbClient: PoolClient, network: NetworkName, params: AccrueInterestParams) => {
    await kvStoreSet(dbClient, `accrue-interest-params-${network}`, JSON.stringify(params));
}

export const getIrParams = async (dbClient: PoolClient, network: NetworkName): Promise<InterestRateParams | null> => {
    return await kvStoreGet(dbClient, `ir-params-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}

export const getLpParams = async (dbClient: PoolClient, network: NetworkName): Promise<LpParams | null> => {
    return await kvStoreGet(dbClient, `lp-params-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}

export const getAccrueInterestParams = async (dbClient: PoolClient, network: NetworkName): Promise<AccrueInterestParams | null> => {
    return await kvStoreGet(dbClient, `accrue-interest-params-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}