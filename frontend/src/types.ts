import { ContractEntity } from "granite-liq-bot-common";

export type Contract = ContractEntity & {
    operatorBalance: number,
    ownerAddress: string,
    unprofitabilityThreshold: number
}

export type ContractState = {
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

export type ToastState = {
    message: null | string,
    type: ToastType,
    setToast: (message: null | string, type: ToastType) => void,
}

export type Modal = { body: JSX.Element, fullScreen?: boolean } | null;

export type ModalState = {
    modal: Modal | null,
    setModal: (modal: Modal | null) => void,   
}