import type { NetworkName } from "granite-liq-bot-common";
import { PRICE_FEED_IDS } from "./constants";
import type { PriceFeed } from "./types";

export const getNetworkNameFromAddress = (address: string): NetworkName => {
    if (address.startsWith('ST') || address.startsWith('SN')) {
        return 'testnet';
    }

    if (address.startsWith('SP') || address.startsWith('SM')) {
        return 'mainnet';
    }

    throw new Error('Invalid address');
}

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

  export const symbolToTicker = (symbol: string) => {
    const key = Object.keys(PRICE_FEED_IDS).find(key => symbol.toLowerCase().indexOf(key.toLowerCase()) !== -1);
    if (!key) {
        throw new Error(`Price feed key not exists for ${symbol}`);
    }
    return key as keyof PriceFeed
  }