import type { NetworkName } from "./types";


export const getNetworkNameFromAddress = (address: string): NetworkName => {
    if (address.startsWith('ST')) {
        return 'testnet';
    }

    if (address.startsWith('SP')) {
        return 'mainnet';
    }

    throw new Error('Invalid address');
}