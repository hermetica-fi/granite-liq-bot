import type { Ticker } from "./client/pyth";
import { config } from "./config/dist";

const USE_STAGING = process.env.USE_STAGING === "1";

export const IR_PARAMS_SCALING_FACTOR = 12;
export const MARKET_ASSET_DECIMAL = 6;

const market = USE_STAGING ? config.markets.MAINNET_STAGING : config.markets.MAINNET;
const { contracts } = market;

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

export const PRICE_FEED_IDS: { ticker: Ticker, feed_id: string }[] = [
    { ticker: "btc", feed_id: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43" },
    { ticker: "eth", feed_id: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace" },
    { ticker: "usdc", feed_id: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a" },
]

export const LIQUIDATION_PREMIUM = 0.1;

export const MIN_TO_LIQUIDATE = 0.1; // usdc
export const MIN_TO_LIQUIDATE_PER_USER = 0.1; // usdc
export const TX_TIMEOUT = 60 * 10; // seconds
export const BORROWER_SYNC_DELAY = 10; // seconds

export const DRY_RUN = process.env.DRY_RUN === "1";
export const SKIP_PROFITABILITY_CHECK = process.env.SKIP_PROFITABILITY_CHECK === "1";

export const ALERT_BALANCE = 5_00000;