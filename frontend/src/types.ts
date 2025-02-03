import { StacksNetworkName } from "@stacks/network";

export type ContractEntity = {
    id: string,
    address: string,
    name: string,
    network: StacksNetworkName,
    operator_address: string
}

export type ContractsState = {
    initialized: boolean,
    loading: boolean,
    contracts: ContractEntity[],
    loadContracts: () => Promise<void>,
    addContract: (address: string, mnemonic: string) => Promise<void>
}

export type Borrower = {
    address: string,
    network: StacksNetworkName,
    ltv: number,
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    maxRepayAmount: number,
}


export type ToastType = null | 'error' | 'warning' | 'info' | 'success';

export interface ToastState {
    message: null | string,
    type: ToastType,
    setToast: (message: null | string, type: ToastType) => void,
}
