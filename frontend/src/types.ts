import { ContractEntity } from "granite-liq-bot-common";

export type Contract = ContractEntity & {
    operatorBalance: number,
    ownerAddress: string,
    unprofitabilityThreshold: number,
    marketAssets: string[],
    balances: Record<string, number>,
}

export type ContractState = {
    initialized: boolean,
    loading: boolean,
    data: Contract | null,
    loadContract: (baseContract: ContractEntity) => Promise<void>,
}

export type ContractsListState = {
    initialized: boolean,
    loading: boolean,
    contracts: ContractEntity[],
    loadContracts: () => Promise<void>,
    addContract: (address: string, mnemonic: string) => Promise<void>
}

export type ToastType = null | 'error' | 'warning' | 'info' | 'success';

export interface ToastState {
    message: null | string,
    type: ToastType,
    setToast: (message: null | string, type: ToastType) => void,
}
