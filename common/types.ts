export type NetworkName = "mainnet" | "testnet";

export type ContractEntity = {
    id: string,
    address: string,
    name: string,
    network: NetworkName,
    operatorAddress: string
}