import { GRANITE_MARKETS } from "./conf/types";
import { assertEnvVar, assertNumericEnvVar } from "./util";

export const MARKET: GRANITE_MARKETS = assertEnvVar("MARKET");
export const MIN_TO_LIQUIDATE = assertNumericEnvVar("MIN_TO_LIQUIDATE", 4);
export const MIN_TO_LIQUIDATE_PER_USER = assertNumericEnvVar("MIN_TO_LIQUIDATE_PER_USER", 1);
export const TX_TIMEOUT = assertNumericEnvVar("TX_TIMEOUT", 600);
export const CONTRACT_UNLOCK_DELAY = assertNumericEnvVar("CONTRACT_UNLOCK_DELAY", 10);
export const DRY_RUN = process.env.DRY_RUN === "1";
export const SKIP_SWAP_CHECK = process.env.SKIP_SWAP_CHECK === "1";
export const USE_FLASH_LOAN = process.env.USE_FLASH_LOAN === "1";
export const LIQUIDATON_CAP = assertNumericEnvVar("LIQUIDATON_CAP");
export const ALERT_BALANCE = assertNumericEnvVar("ALERT_BALANCE", 1);
export const HAS_HIRO_API_KEY = process.env.HIRO_API_KEY !== undefined;
export const PRICE_FEED_FRESHNESS_THRESHOLD = 300; // 5 min
export const PRICE_FEED_FRESHNESS_BUFFER = 60; // 60 secs
export const LIQUIDATON_POS_COUNT_MIN = assertNumericEnvVar("LIQUIDATON_POS_COUNT_MIN", 10);
export const LIQUIDATON_POS_COUNT_MAX = assertNumericEnvVar("LIQUIDATON_POS_COUNT_MAX", 20); 
export const RBF_THRESHOLD = 15; // seconds
export const SWAP_THRESHOLD = assertNumericEnvVar("SWAP_THRESHOLD", 0);