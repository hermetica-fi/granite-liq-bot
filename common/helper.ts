import type { NetworkName } from "granite-liq-bot-common";

export const addressLink = (address: string, network: NetworkName) => {
    return `https://explorer.hiro.so/address/${address}?chain=${network}`;
}

export const transactionLink = (txid: string, network: NetworkName) => {
    return `https://explorer.hiro.so/txid/${txid}?chain=${network}`;
}