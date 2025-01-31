import assert from "assert";
import type { PoolClient } from "pg";
import type { MarketState, NetworkName } from "../../types";
import { getAccrueInterestParamsLocal, getCollateralParamsLocal, getDebtParamsLocal, getIrParamsLocal, getLpParamsLocal, getPriceFeedLocal } from "./lib";

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
    const priceFeed = await getPriceFeedLocal(dbClient);
    assert(priceFeed, 'priceFeed not found');

    return {
        irParams,
        lpParams,
        accrueInterestParams,
        debtParams,
        collateralParams,
        priceFeed   
    }
}

