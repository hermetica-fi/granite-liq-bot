import { create } from 'zustand';
import { fetchContracts, postAddContract } from '../api';
import { ContractState } from '../types';

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
        set({ items: resp, loading: false, initialized: true });
    }
}))

