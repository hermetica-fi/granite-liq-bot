import config from "./conf";
import { GRANITE_MARKETS } from "./conf/types";
import type { PriceTicker } from "./types";

export function hexToUint8Array(hexString: string): Uint8Array {
  // Remove any leading "0x" from the hex string if it exists
  if (hexString.startsWith('0x')) {
    hexString = hexString.slice(2);
  }

  // Check if hexString has an even length, pad with '0' if not
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }

  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
}

export const toTicker = (val: string): PriceTicker => {
  if (val.toLowerCase().indexOf("btc") !== -1) {
    return "btc"
  } else if (val.toLowerCase().indexOf("eth") !== -1) {
    return "eth"
  } else if (val.toLowerCase().indexOf("usdc") !== -1) {
    return "usdc"
  }

  throw new Error(`Invalid symbol: ${val}`);
}

export const getMarket = () => {
  if (process.env.MARKET === GRANITE_MARKETS.AEUSDC) {
    return config.markets.AEUSDC;
  } else if (process.env.MARKET === GRANITE_MARKETS.AEUSDC_STAGING) {
    return config.markets.AEUSDC_STAGING;
  } else if (process.env.MARKET === GRANITE_MARKETS.USDCX) {
    return config.markets.USDCX;
  } else {
    throw new Error("Invalid market");
  }
}

export const toCollateralAddress = (collateralId: string) => {
  if (collateralId === "sbtc-token") {
    return "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";
  }

  throw new Error(`Invalid collateral id: ${collateralId}`);
}