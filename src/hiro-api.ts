import type { StacksNetwork, StacksNetworkName } from "@stacks/network";


export const fetchWrapper = async (url: string) => {
    // TODO: Inject hiro api key
    return fetch(url);
}

export const getContractInfo = async (contractId: string, network: StacksNetwork) => {
    return fetchWrapper(`${network.client.baseUrl}/extended/v1/contract/${contractId}`).then(r => r.json())
}