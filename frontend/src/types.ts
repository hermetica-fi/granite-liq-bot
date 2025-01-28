import { StacksNetworkName } from "@stacks/network";

export type Contract = {
    address: string,
    network: StacksNetworkName,
    owner_address: string
}

export type ContractState = {
    initialized: boolean,
    loading: boolean,
    contracts: Contract[]
}