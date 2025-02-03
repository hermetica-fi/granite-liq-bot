import assert from "assert";
import type { PoolClient } from "pg";
import { MARKET_ASSET_DECIMAL } from "../constants";
import { kvStoreGet, kvStoreSet } from "../db/helper";
import type {
    AccrueInterestParams, BorrowerCollateralEntity, BorrowerEntity,
    BorrowerPositionEntity, BorrowerStatus,
    CollateralParams, DebtParams, InterestRateParams, LpParams,
    MarketState, NetworkName, PriceFeed
} from "../types";

export const upsertBorrower = async (dbClient: PoolClient, network: NetworkName, address: string): Promise< 0 | 1 | 2> => {
    const rec = await dbClient.query("SELECT sync_flag FROM borrower WHERE address = $1", [address]).then((r) => r.rows[0]);
    if (!rec) {
        await dbClient.query("INSERT INTO borrower (address, network) VALUES ($1, $2)", [
            address,
            network,
        ]);
        return 1;
    } else {
        if (rec.sync_flag === 0) {
            await dbClient.query("UPDATE borrower SET sync_flag = 1 WHERE address = $1", [address]);
            return 2;
        }
    }
    return 0;
}

export const getBorrowersToSync = async (dbClient: PoolClient): Promise<Pick<BorrowerEntity, 'address' | 'network'>[]> => {
    return dbClient.query("SELECT address, network FROM borrower WHERE sync_flag = 1").then(r => r.rows);
}

export const switchBorrowerSyncFlagOff = async (dbClient: PoolClient, address: string): Promise<any> => {
    return dbClient.query("UPDATE borrower SET sync_flag = 0 WHERE address = $1", [address]);
}

export const syncBorrowerPosition = async (dbClient: PoolClient, userPosition: BorrowerPositionEntity): Promise<any> => {
    await dbClient.query("DELETE FROM borrower_position WHERE address = $1 ", [userPosition.address]);
    return dbClient.query("INSERT INTO borrower_position (address, network, debt_shares, collaterals) VALUES ($1, $2, $3, $4)",
        [userPosition.address, userPosition.network, userPosition.debtShares, userPosition.collaterals]);
}

export const syncBorrowerCollaterals = async (dbClient: PoolClient, address: string, collaterals: Omit<BorrowerCollateralEntity, 'address'>[]): Promise<any> => {
    await dbClient.query("DELETE FROM borrower_collaterals WHERE address = $1", [address]);

    for (const collateral of collaterals) {
        await dbClient.query("INSERT INTO borrower_collaterals (address, network, collateral, amount) VALUES ($1, $2, $3, $4)", 
            [address, collateral.network, collateral.collateral, collateral.amount]);
    }
}

export const getBorrowersForHealthCheck = async (dbClient: PoolClient): Promise<{ address: string, network: string, debtShares: number, collaterals: string[] }[]> => {
    return dbClient.query("SELECT address, network, debt_shares, collaterals FROM borrower_position").then(r => r.rows).then(rows => (
        rows.map(row => ({
            address: row.address,
            network: row.network,
            debtShares: Number(row.debt_shares),
            collaterals: row.collaterals
        }))
    ))
}

export const getBorrowerCollateralAmount = async (dbClient: PoolClient, address: string, collateral: string): Promise<number | undefined> => {
    return dbClient.query("SELECT amount FROM borrower_collaterals WHERE address=$1 AND collateral=$2", [address, collateral]).then(r => r.rows[0] ? Number(r.rows[0].amount) : undefined)
}

export const clearBorrowerStatuses = async (dbClient: PoolClient) => {
    await dbClient.query("DELETE FROM borrower_status");
}

export const insertBorrowerStatus = async (dbClient: PoolClient, address: string, network: NetworkName, status: BorrowerStatus) => {
    return dbClient.query(
        `INSERT INTO borrower_status (
            address, network, ltv, health, debt, collateral, risk, max_repay_amount
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
        )`,
        [address, network, status.ltv.toFixed(4), status.health.toFixed(4), status.debt.toFixed(4), status.collateral.toFixed(4), status.risk.toFixed(4), status.maxRepayAmount.toFixed(4)])
}


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
        priceFeed,
        marketAssetParams: {
            decimals: MARKET_ASSET_DECIMAL[network],
        }   
    }
}

