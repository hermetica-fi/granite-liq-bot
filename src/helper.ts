import type { StacksNetworkName } from "@stacks/network";


export const getNetworkNameFromAddress = (address: string): StacksNetworkName => {
    if (address.startsWith('ST')) {
        return 'testnet';
    }

    if (address.startsWith('SP')) {
        return 'mainnet';
    }

    throw new Error('Invalid principal');
}