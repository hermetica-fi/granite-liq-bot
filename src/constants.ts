import type { Ticker } from "./client/pyth";
import { config } from "./config/dist";
import { toTicker } from "./helper";

export const USE_STAGING = process.env.USE_STAGING === "1";

const market = USE_STAGING ? config.markets.MAINNET_STAGING : config.markets.MAINNET;
const { contracts } = market;

export const IR_PARAMS_SCALING_FACTOR = market.scaling_factor.toString().match(/0/g)!.length;
export const MARKET_ASSET_DECIMAL = market.market_asset.decimals;
export const MARKET_ASSET = `${market.market_asset.contract.principal}.${market.market_asset.contract.name}`;

export const CONTRACTS: {
    borrower: string;
    state: string;
    ir: string;
    liquidator: string;
    collaterals: string[];
} = {
    borrower: `${contracts.BORROWER.principal}.${contracts.BORROWER.name}`,
    state: `${contracts.STATE.principal}.${contracts.STATE.name}`,
    ir: `${contracts.INTEREST_RATE.principal}.${contracts.INTEREST_RATE.name}`,
    liquidator: `${contracts.LIQUIDATOR.principal}.${contracts.LIQUIDATOR.name}`,
    collaterals: market.collaterals.map(x => `${x.contract.principal}.${x.contract.name}`)
};

export const PRICE_FEED_IDS: { ticker: Ticker, feed_id: string }[] = [market.market_asset, ...market.collaterals]
    .map(a => ({ ticker: toTicker(a.display_name), feed_id: `0x${a.price_feed!}` }));

export const MIN_TO_LIQUIDATE = 2; // usdc
export const MIN_TO_LIQUIDATE_PER_USER = 0.5; // usdc
export const TX_TIMEOUT = 60 * 10; // seconds
export const BORROWER_SYNC_DELAY = 10; // seconds

export const DRY_RUN = process.env.DRY_RUN === "1";
export const SKIP_SWAP_CHECK = process.env.SKIP_SWAP_CHECK === "1";
export const USE_FLASH_LOAN = process.env.USE_FLASH_LOAN === "1";

export const ALERT_BALANCE = 5_00000;

export const HAS_HIRO_API_KEY = process.env.HIRO_API_KEY !== undefined;