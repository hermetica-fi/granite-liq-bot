import assert from "assert";
import type { NetworkName } from "granite-liq-bot-common";
import { MARKET_ASSET_DECIMAL } from "../constants";
import { kvStoreGet, kvStoreSet } from "../db/helper";
import type {
    AccrueInterestParams,
    CollateralParams, DebtParams, InterestRateParams, LpParams,
    MarketState
} from "../types";


export const getIrParamsLocal = (network: NetworkName): InterestRateParams | null => {
    const r = kvStoreGet(`ir-params-${network}`);
    return r ? JSON.parse(r) : null;
}

export const setIrParamsLocal = (network: NetworkName, irParams: InterestRateParams) => {
    kvStoreSet(`ir-params-${network}`, JSON.stringify(irParams));
}

export const getLpParamsLocal = (network: NetworkName): LpParams | null => {
    const r = kvStoreGet(`lp-params-${network}`);
    return r ? JSON.parse(r) : null;
}

export const setLpParamsLocal = (network: NetworkName, lpParams: LpParams) => {
    kvStoreSet(`lp-params-${network}`, JSON.stringify(lpParams));
}

export const getAccrueInterestParamsLocal = (network: NetworkName): AccrueInterestParams | null => {
    const r = kvStoreGet(`accrue-interest-params-${network}`);
    return r ? JSON.parse(r) : null;
}

export const setAccrueInterestParamsLocal = (network: NetworkName, accrueInterestParams: AccrueInterestParams) => {
    kvStoreSet(`accrue-interest-params-${network}`, JSON.stringify(accrueInterestParams));
}

export const getDebtParamsLocal = (network: NetworkName): DebtParams | null => {
    const r = kvStoreGet(`debt-params-${network}`);
    return r ? JSON.parse(r) : null;
}

export const setDebtParamsLocal = (network: NetworkName, debtParams: DebtParams) => {
    kvStoreSet(`debt-params-${network}`, JSON.stringify(debtParams));
}

export const getCollateralParamsLocal = (network: NetworkName): Record<string, CollateralParams> | null => {
    const r = kvStoreGet(`collateral-params-${network}`);
    return r ? JSON.parse(r) : null;
}

export const setCollateralParamsLocal = (network: NetworkName, collateralParams: Record<string, CollateralParams>) => {
    kvStoreSet(`collateral-params-${network}`, JSON.stringify(collateralParams));
}

export const getMarketState = (network: NetworkName): MarketState => {
    const irParams = getIrParamsLocal(network);
    assert(irParams, 'irParams not found');
    const lpParams = getLpParamsLocal(network);
    assert(lpParams, 'lpParams not found');
    const accrueInterestParams = getAccrueInterestParamsLocal(network);
    assert(accrueInterestParams, 'accrueInterestParams not found');
    const debtParams = getDebtParamsLocal(network);
    assert(debtParams, 'debtParams not found');
    const collateralParams = getCollateralParamsLocal(network);
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

