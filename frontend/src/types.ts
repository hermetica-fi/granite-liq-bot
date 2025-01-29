import { StacksNetworkName } from "@stacks/network";

export type Contract = {
    address: string,
    network: StacksNetworkName,
    owner_address: string
}
export type ContractState = {
    initialized: boolean,
    loading: boolean,
    items: Contract[],
    loadContracts: () => void,
    addContract: (address: string, mnemonic: string) => Promise<void>
}
export type ToastType = null | 'error' | 'warning' | 'info' | 'success';

export interface ToastState {
    message: null | string,
    type: ToastType,
    setToast: (message: null | string, type: ToastType) => void,
}
