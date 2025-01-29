import { fetchContracts, postAddContract } from '../api';
import { Contract } from '../types';
import { create } from 'zustand';

export type ContractState = {
    initialized: boolean,
    loading: boolean,
    items: Contract[],
    loadContracts: () => void,
    addContract: (address: string, mnemonic: string) => Promise<void>
}

export const useContractsStore = create<ContractState>((set, get) => ({
    initialized: false,
    loading: false,
    items: [],
    loadContracts: async () => {
        if (get().loading) return;
        set({ loading: true, initialized: true });
        const data = await fetchContracts();
        set({ items: data, loading: false, initialized: true });
    },
    addContract: async (address: string, mnemonic: string) => {
        const resp = await postAddContract(address, mnemonic);
        if (resp.error) {
            throw new Error(resp.error);
        }
        set({ items: resp, loading: false, initialized: true });
    }
}))

