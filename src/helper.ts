import type { NetworkName } from "granite-liq-bot-common";


export const getNetworkNameFromAddress = (address: string): NetworkName => {
    if (address.startsWith('ST') || address.startsWith('SN')) {
        return 'testnet';
    }

    if (address.startsWith('SP') || address.startsWith('SM')) {
        return 'mainnet';
    }

    throw new Error('Invalid address');
}