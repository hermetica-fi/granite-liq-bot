export type NetworkName = "mainnet" | "testnet";

export type AssetInfo = {
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    balance: number,
}

export type ContractEntity = {
    id: string,
    address: string,
    name: string,
    network: NetworkName,
    operatorAddress: string,
    marketAsset: AssetInfo | null,
    collateralAsset: AssetInfo | null
}

export type BorrowerStatus = {
    ltv: number,
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    maxRepay: Record<string, number>,
    totalRepayAmount: number
}

export type BorrowerStatusEntity = BorrowerStatus & { address: string, network: NetworkName }