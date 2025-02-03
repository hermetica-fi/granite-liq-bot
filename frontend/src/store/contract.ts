import { StacksNetworkName } from '@stacks/network';
import { cvToJSON } from '@stacks/transactions';
import { create } from 'zustand';
import { callReadOnly } from '../api/hiro';
import { ContractState } from '../types';
export const useContractStore = create<ContractState>((set, get) => ({
    initialized: false,
    loading: false,
    data: null,
    loadContract: async (address: string, name :string, network: StacksNetworkName) => {
        if (get().loading) return;
        set({ initialized: true, loading: true });

        return callReadOnly({
            contractAddress: address,
            contractName: name,
            functionName: 'get-info',
            functionArgs: [],
            senderAddress: address,
            network,
        }).then(data => {
           const json = cvToJSON(data);
           
           const marketAssets = json.value["market-assets"].value;
           const operator = json.value["operator"].value;
           const owner = json.value["owner"].value;
           const unprofitabilityThreshold = Number(json.value["unprofitability-threshold"].value);

           console.log({ marketAssets, operator, owner, unprofitabilityThreshold })
           // set();
        }).catch((error) => {
            set({ loading: false });
            throw error;
        })
    }
  
}))