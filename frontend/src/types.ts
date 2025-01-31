import { StacksNetworkName } from "@stacks/network";

export type Contract = {
    id: string,
    address: string,
    name: string,
    network: StacksNetworkName,
    owner_address: string
}
export type ContractState = {
    initialized: boolean,
    loading: boolean,
    contracts: Contract[],
    loadContracts: () => Promise<void>,
    addContract: (address: string, mnemonic: string) => Promise<void>
}

export type Borrower = {
    address: string,
    network: StacksNetworkName,
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    liquidateAmt: number,
}


export type ToastType = null | 'error' | 'warning' | 'info' | 'success';

export interface ToastState {
    message: null | string,
    type: ToastType,
    setToast: (message: null | string, type: ToastType) => void,
}
