import { cvToJSON } from '@stacks/transactions';
import { callReadOnly, ContractEntity, getAccountBalances } from 'granite-liq-bot-common';
import { create } from 'zustand';
import { ContractState } from '../types';

export const useContractStore = create<ContractState>((set, get) => ({
    initialized: false,
    loading: false,
    data: null,
    loadContract: async (baseContract: ContractEntity) => {
        if (get().loading) return;
        set({
            initialized: true,
            loading: true,
            data: {
                ...baseContract,
                operatorBalance: 0,
                ownerAddress: '',
                unprofitabilityThreshold: 0,
                marketAssets: [],
                balances: {}
            }
        });

        return callReadOnly({
            contractAddress: baseContract.address,
            contractName: baseContract.name,
            functionName: 'get-info',
            functionArgs: [],
            senderAddress: baseContract.address,
            network: baseContract.network,
        }).then(data => {
            const json = cvToJSON(data);

            const marketAssets = json.value["market-assets"].value.map((x: {value: string}) => x.value)
            const operatorAddress = json.value["operator"].value;
            const ownerAddress = json.value["owner"].value;
            const unprofitabilityThreshold = Number(json.value["unprofitability-threshold"].value);

            set((state) => ({
                ...state,
                data: {
                    ...state.data!,
                    marketAssets,
                    operatorAddress,
                    ownerAddress,
                    unprofitabilityThreshold
                }
            }));

            return getAccountBalances(operatorAddress, baseContract.network);
        }).then((operatorBalances) => {
            const operatorBalance = Number(operatorBalances.stx.balance) - Number(operatorBalances.stx.locked);

            set((state) => (
                {
                    ...state,
                    data: {
                        ...state.data!,
                        operatorBalance
                    }
                })
            );

            return getAccountBalances(baseContract.id, baseContract.network);
        }).then((contractBalances) => {
            const balances: Record<string, number> = {};
            for (const b of Object.keys(contractBalances.fungible_tokens)) {
                balances[b] = Number(contractBalances.fungible_tokens[b]?.balance);
            }

            set((state) => (
                {
                    ...state,
                    data: {
                        ...state.data!,
                        balances
                    },
                    loading: false,
                })
            );
        }).catch((error) => {
            set({ loading: false });
            throw error;
        })
    }
}))