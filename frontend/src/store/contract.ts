import { contractPrincipalCV, cvToJSON } from '@stacks/transactions';
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
                marketAsset: null,
            }
        });

        try {
            const info = await callReadOnly({
                contractAddress: baseContract.address,
                contractName: baseContract.name,
                functionName: 'get-info',
                functionArgs: [],
                senderAddress: baseContract.address,
                network: baseContract.network,
            }).then(r => cvToJSON(r));

            const marketAsset = info.value["market-assets"].value.map((x: { value: string }) => x.value)[0] as string || null;
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
                    }
                })
            );

            if (marketAsset) {
                const symbol = await callReadOnly({
                    contractAddress: marketAsset.split('.')[0],
                    contractName: marketAsset.split('.')[1],
                    functionName: 'get-symbol',
                    functionArgs: [],
                    senderAddress: operatorAddress,
                    network: baseContract.network,
                }).then(r => cvToJSON(r).value.value);

                const decimals = await callReadOnly({
                    contractAddress: marketAsset.split('.')[0],
                    contractName: marketAsset.split('.')[1],
                    functionName: 'get-decimals',
                    functionArgs: [],
                    senderAddress: operatorAddress,
                    network: baseContract.network,
                }).then(r => cvToJSON(r).value.value);

                const balance = await callReadOnly({
                    contractAddress: marketAsset.split('.')[0],
                    contractName: marketAsset.split('.')[1],
                    functionName: 'get-balance',
                    functionArgs: [
                        contractPrincipalCV(baseContract.address, baseContract.network)
                    ],
                    senderAddress: operatorAddress,
                    network: baseContract.network,
                }).then(r => cvToJSON(r).value.value);

                set((state) => ({
                    ...state,
                    data: {
                        ...state.data!,
                        marketAsset: {
                            address: marketAsset,
                            symbol,
                            decimals,
                            balance
                        }
                    }
                }));
            }

            set({ loading: false });
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    }
}))