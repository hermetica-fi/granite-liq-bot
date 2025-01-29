import type { StacksNetwork, StacksNetworkName } from "@stacks/network";
import { networkFromName } from "@stacks/network";
import { type TransactionEventsResponse } from "@stacks/stacks-blockchain-api-types";


export const fetchWrapper = async (path: string, network: StacksNetworkName) => {
    // TODO: Inject hiro api key
    const networkObj = networkFromName(network);
    return fetch(`${networkObj.client.baseUrl}${path}`);
}

export const getContractInfo = async (contractId: string, network: StacksNetworkName) => {
    return fetchWrapper(`/extended/v1/contract/${contractId}`, network).then(r => r.json())
}

export const getContractEvents = async (contractId: string, limit: number, offset: number, network: StacksNetworkName): Promise<TransactionEventsResponse> => {
    return fetchWrapper(`/extended/v1/contract/${contractId}/events?limit=${limit}&offset=${offset}`, network).then(r => r.json())
}