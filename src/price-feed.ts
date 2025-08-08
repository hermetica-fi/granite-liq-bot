import { fetchAndProcessPriceFeed } from "./client/pyth";
import { PRICE_FEED_FRESHNESS_BUFFER, PRICE_FEED_FRESHNESS_THRESHOLD } from "./constants";
import type { MarketState, PriceFeedItem, PriceFeedResponseMixed, PriceTicker } from "./types";
import { epoch } from "./util";

export const getPriceFeed = async (tickers: PriceTicker[], marketState: MarketState): Promise<PriceFeedResponseMixed> => {
    let liveFeed;

    let items: Record<string, PriceFeedItem> = {}

    for (let ticker of tickers) {
        if (marketState.onChainPriceFeed[ticker] &&
            (epoch() - marketState.onChainPriceFeed[ticker].publish_time) < (PRICE_FEED_FRESHNESS_THRESHOLD - PRICE_FEED_FRESHNESS_BUFFER)) {
            items[ticker] = marketState.onChainPriceFeed[ticker];
            continue;
        }

        if (!liveFeed) {
            liveFeed = await fetchAndProcessPriceFeed();
        }

        if (liveFeed.items[ticker]) {
            items[ticker] = liveFeed.items[ticker];
            continue;
        }

        throw new Error('Feed not found');
    }

    return {
        attestation: liveFeed ? liveFeed.attestation : null,
        items
    }
}