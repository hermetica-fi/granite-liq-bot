import { cvToJSON, fetchCallReadOnlyFunction } from '@stacks/transactions';
import { ContractEntity, fetchFn, getAccountBalances } from 'granite-liq-bot-common';
import { create } from 'zustand';
import { ContractState } from '../types';

export const useContractStore = create<ContractState>((set, get) => ({
    loading: false,
    data: null,
    loadContract: async (baseContract: ContractEntity) => {
        if (get().loading) return;
        set({
            loading: true,
            data: {
                ...baseContract,
                operatorBalance: 0,
                ownerAddress: '',
                unprofitabilityThreshold: 0,
            }
        });

        try {
            const info = await fetchCallReadOnlyFunction({
                contractAddress: baseContract.address,
                contractName: baseContract.name,
                functionName: 'get-info',
                functionArgs: [],
                senderAddress: baseContract.address,
                network: baseContract.network,
                client: {
                    fetch: fetchFn,
                }
            }).then(r => cvToJSON(r));


            const operatorAddress = info.value["operator"].value;
            const ownerAddress = info.value["owner"].value;
            const unprofitabilityThreshold = Number(info.value["unprofitability-threshold"].value);

            set((state) => ({
                ...state,
                data: {
                    ...state.data!,
                    operatorAddress,
                    ownerAddress,
                    unprofitabilityThreshold
                }
            }));

            const operatorBalances = await getAccountBalances(operatorAddress, baseContract.network);
            const operatorBalance = Number(operatorBalances.stx.balance) - Number(operatorBalances.stx.locked);
            set((state) => (
                {
                    ...state,
                    data: {
                        ...state.data!,
                        operatorBalance
                    },

                    loading: false
                })
            );
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    }
}))