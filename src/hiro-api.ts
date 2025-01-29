import type { StacksNetwork, StacksNetworkName } from "@stacks/network";
import { type TransactionEventsResponse } from "@stacks/stacks-blockchain-api-types";


export const fetchWrapper = async (url: string) => {
    // TODO: Inject hiro api key
    return fetch(url);
}

export const getContractInfo = async (contractId: string, network: StacksNetwork) => {
    return fetchWrapper(`${network.client.baseUrl}/extended/v1/contract/${contractId}`).then(r => r.json())
}

export const getContractEvents = async (contractId: string, limit: number, offset: number, network: StacksNetwork): Promise<TransactionEventsResponse> => {
    return fetchWrapper(`${network.client.baseUrl}/extended/v1/contract/${contractId}/events?limit=${limit}&offset=${offset}`).then(r => r.json())
}