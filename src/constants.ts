import type { PriceFeed } from "./types";

export const IR_PARAMS_SCALING_FACTOR = 12;

export const MARKET_ASSET_DECIMAL = {
    "mainnet": 6,
    "testnet": 8
}

export const CONTRACTS = {
    "mainnet": {
        "borrower": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.borrower-v1",
        "state": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.state-v1",
        "ir": "SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.linear-kinked-ir-v1"
    },
    "testnet": {
        "borrower": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.borrower-v1",
        "state": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.state-v1",
        "ir": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.linear-kinked-ir-v1"
    }
}

export const PRICE_FEED_IDS: Record<keyof PriceFeed, string> = {
    "btc": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "eth": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "usdc": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
}

export const MAINNET_MAX_FEE = 7_000_00; // 0.7 STX