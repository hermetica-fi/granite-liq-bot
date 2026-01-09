import { getMarket } from "../../helper";
import { createLogger } from "../../logger";
import { withRetry } from "../../util";
import type { LiquidationsResponse, MarketInfoResponse } from "./types";

const logger = createLogger("backend");

const market = getMarket();


export const _fetchGetMarketInfo = async (): Promise<MarketInfoResponse> => {
    const url = `${market.apiBase}/v1/market/info`;
    return fetch(url).then(r => r.json());
};

export const _fetchGetBorrowerPositions = async (limit: number = 20, offset: number = 0): Promise<LiquidationsResponse> => {
    const url = `${market.apiBase}/v1/liquidations/account_health?limit=${limit}&offset=${offset}`;
    return fetch(url).then(r => r.json());
};

export async function fetchGetMarketInfo(): Promise<MarketInfoResponse> {
    return withRetry(_fetchGetMarketInfo, 5, async (err, attempt) => {
        logger.error(
            `fetchGetMarketInfo call failed at attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`
        );
        await new Promise(res => setTimeout(res, 200));
    });
};

export const fetchGetBorrowerPositions = async (limit: number = 20, offset: number = 0): Promise<LiquidationsResponse> => {
    return withRetry(async () => _fetchGetBorrowerPositions(limit, offset), 5, async (err, attempt) => {
        logger.error(
            `fetchGetBorrowerPositions call failed at attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`
        );
        await new Promise(res => setTimeout(res, 200));
    });
};