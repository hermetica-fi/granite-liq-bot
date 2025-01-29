import { create } from 'zustand';
import { fetchContracts, postAddContract } from '../api';
import { ContractState } from '../types';

export const useContractsStore = create<ContractState>((set, get) => ({
    initialized: false,
    loading: false,
    contracts: [],
    loadContracts: async () => {
        if (get().loading) return;
        set({ initialized: true, loading: true });
        return fetchContracts().then(data => {
            set({ contracts: data, loading: false });
        }).catch((error) => {
            set({ loading: false });
            throw error;
        })
    },
    addContract: async (address: string, mnemonic: string) => {
        return postAddContract(address, mnemonic).then(data => {
            set({ contracts: data });
        });
    }
}))

