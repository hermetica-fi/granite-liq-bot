import type { PoolClient } from "pg";
import { kvStoreGet, kvStoreSet } from "../../db/helper";
import type { AccrueInterestParams, CollateralParams, DebtParams, InterestRateParams, LpParams, NetworkName, PriceFeed } from "../../types";

export const getDistinctCollateralList = async (dbClient: PoolClient): Promise<string[]> => {
    return dbClient.query("SELECT collateral FROM borrower_collaterals GROUP BY collateral").then(r => r.rows.map(r => r.collateral));
}

export const getIrParamsLocal = async (dbClient: PoolClient, network: NetworkName): Promise<InterestRateParams | null> => {
    return await kvStoreGet(dbClient, `ir-params-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}

export const setIrParamsLocal = async (dbClient: PoolClient, network: NetworkName, irParams: InterestRateParams) => {
    await kvStoreSet(dbClient, `ir-params-${network}`, JSON.stringify(irParams));
}

export const getLpParamsLocal = async (dbClient: PoolClient, network: NetworkName): Promise<LpParams | null> => {
    return await kvStoreGet(dbClient, `lp-params-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}

export const setLpParamsLocal = async (dbClient: PoolClient, network: NetworkName, lpParams: LpParams) => {
    await kvStoreSet(dbClient, `lp-params-${network}`, JSON.stringify(lpParams));
}

export const getAccrueInterestParamsLocal = async (dbClient: PoolClient, network: NetworkName): Promise<AccrueInterestParams | null> => {
    return await kvStoreGet(dbClient, `accrue-interest-params-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}

export const setAccrueInterestParamsLocal = async (dbClient: PoolClient, network: NetworkName, accrueInterestParams: AccrueInterestParams) => {
    await kvStoreSet(dbClient, `accrue-interest-params-${network}`, JSON.stringify(accrueInterestParams));
}

export const getDebtParamsLocal = async (dbClient: PoolClient, network: NetworkName): Promise<DebtParams | null> => {
    return await kvStoreGet(dbClient, `debt-params-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}

export const setDebtParamsLocal = async (dbClient: PoolClient, network: NetworkName, debtParams: DebtParams) => {
    await kvStoreSet(dbClient, `debt-params-${network}`, JSON.stringify(debtParams));
}

export const getCollateralParamsLocal = async (dbClient: PoolClient, network: NetworkName): Promise<Record<string, CollateralParams> | null> => {
    return await kvStoreGet(dbClient, `collateral-params-${network}`).then((r: any) => r ? JSON.parse(r) : null);
}

export const setCollateralParamsLocal = async (dbClient: PoolClient, network: NetworkName, collateralParams: Record<string, CollateralParams>) => {
    await kvStoreSet(dbClient, `collateral-params-${network}`, JSON.stringify(collateralParams));
}

export const getPriceFeedLocal = async (dbClient: PoolClient): Promise<PriceFeed | null> => {
    return await kvStoreGet(dbClient, `price-feed`).then((r: any) => r ? JSON.parse(r) : null);
}

export const setPriceFeedLocal = async (dbClient: PoolClient, priceFeed: PriceFeed) => {
    await kvStoreSet(dbClient, `price-feed`, JSON.stringify(priceFeed));
}
