export type NetworkName = "mainnet" | "testnet";

export type ContractEntity = {
    id: string,
    address: string,
    name: string,
    network: NetworkName,
    operatorAddress: string
}

export type BorrowerStatus = {
    ltv: number,
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    maxRepayAmount: number
}

export type BorrowerStatusEntity = BorrowerStatus & { address: string, network: NetworkName }