import assert from "assert";
import { kvStoreGet, kvStoreSet } from "../db/helper";
import { getMarket } from "../helper";
import type {
    AccrueInterestParams,
    CollateralParams, DebtParams, InterestRateParams, LpParams,
    MarketState,
    PriceFeedItem,
    PriceTicker
} from "../types";

export const getIrParamsLocal = (): InterestRateParams | null => {
    const r = kvStoreGet(`ir-params`);
    return r ? JSON.parse(r) : null;
}

export const setIrParamsLocal = (irParams: InterestRateParams) => {
    kvStoreSet(`ir-params`, JSON.stringify(irParams));
}

export const getLpParamsLocal = (): LpParams | null => {
    const r = kvStoreGet(`lp-params`);
    return r ? JSON.parse(r) : null;
}

export const setLpParamsLocal = (lpParams: LpParams) => {
    kvStoreSet(`lp-params`, JSON.stringify(lpParams));
}

export const getAccrueInterestParamsLocal = (): AccrueInterestParams | null => {
    const r = kvStoreGet(`accrue-interest-params`);
    return r ? JSON.parse(r) : null;
}

export const setAccrueInterestParamsLocal = (accrueInterestParams: AccrueInterestParams) => {
    kvStoreSet(`accrue-interest-params`, JSON.stringify(accrueInterestParams));
}

export const getDebtParamsLocal = (): DebtParams | null => {
    const r = kvStoreGet(`debt-params`);
    return r ? JSON.parse(r) : null;
}

export const setDebtParamsLocal = (debtParams: DebtParams) => {
    kvStoreSet(`debt-params`, JSON.stringify(debtParams));
}

export const getCollateralParamsLocal = (): Record<string, CollateralParams> | null => {
    const r = kvStoreGet(`collateral-params`);
    return r ? JSON.parse(r) : null;
}

export const setCollateralParamsLocal = (collateralParams: Record<string, CollateralParams>) => {
    kvStoreSet(`collateral-params`, JSON.stringify(collateralParams));
}

export const getOnChainPriceFeed = (): Partial<Record<PriceTicker, PriceFeedItem>> | null => {
    const r = kvStoreGet(`on-chain-price-feed`);
    return r ? JSON.parse(r) : null;
}

export const setOnChainPriceFeed = (feed: Partial<Record<PriceTicker, PriceFeedItem>>) => {
    kvStoreSet(`on-chain-price-feed`, JSON.stringify(feed));
}

export const setFlashLoanCapacityLocal = (params: Record<string, number>) => {
    kvStoreSet(`flash-loan-capacity`, JSON.stringify(params));
}

export const getFlashLoanCapacityLocal = (): Record<string, number> | null => {
    const r = kvStoreGet(`flash-loan-capacity`);
    return r ? JSON.parse(r) : null;
}

export const getMarketState = (): MarketState => {
    const irParams = getIrParamsLocal();
    assert(irParams, 'irParams not found');
    const lpParams = getLpParamsLocal();
    assert(lpParams, 'lpParams not found');
    const accrueInterestParams = getAccrueInterestParamsLocal();
    assert(accrueInterestParams, 'accrueInterestParams not found');
    const debtParams = getDebtParamsLocal();
    assert(debtParams, 'debtParams not found');
    const collateralParams = getCollateralParamsLocal();
    assert(collateralParams, 'collateralParams not found');
    assert(Object.keys(collateralParams).length > 0, 'collateralParams is empty');
    const flashLoanCapacity = getFlashLoanCapacityLocal();
    assert(flashLoanCapacity, 'flashLoanCapacity not found');
    const onChainPriceFeed = getOnChainPriceFeed();
    assert(onChainPriceFeed!==null, 'onChainPriceFeed not found');
    const market = getMarket();

    return {
        irParams,
        lpParams,
        accrueInterestParams,
        debtParams,
        collateralParams,
        marketAssetParams: {
            decimals: market.market_asset.decimals
        },
        flashLoanCapacity,
        onChainPriceFeed
    }
}

