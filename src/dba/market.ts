import assert from "assert";
import type { NetworkName } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { MARKET_ASSET_DECIMAL } from "../constants";
import { kvStoreGet, kvStoreSet } from "../db/helper";
import type {
    AccrueInterestParams,
    CollateralParams, DebtParams, InterestRateParams, LpParams,
    MarketState
} from "../types";


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

export const getMarketState = async (dbClient: PoolClient, network: NetworkName): Promise<MarketState> => {
    const irParams = await getIrParamsLocal(dbClient, network);
    assert(irParams, 'irParams not found');
    const lpParams = await getLpParamsLocal(dbClient, network);
    assert(lpParams, 'lpParams not found');
    const accrueInterestParams = await getAccrueInterestParamsLocal(dbClient, network);
    assert(accrueInterestParams, 'accrueInterestParams not found');
    const debtParams = await getDebtParamsLocal(dbClient, network);
    assert(debtParams, 'debtParams not found');
    const collateralParams = await getCollateralParamsLocal(dbClient, network);
    assert(collateralParams, 'collateralParams not found');
    assert(Object.keys(collateralParams).length > 0, 'collateralParams is empty');

    return {
        irParams,
        lpParams,
        accrueInterestParams,
        debtParams,
        collateralParams,
        marketAssetParams: {
            decimals: MARKET_ASSET_DECIMAL[network],
        }
    }
}

