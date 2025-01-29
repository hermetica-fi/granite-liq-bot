import type { StacksNetworkName } from "@stacks/network";
import { networkFromName } from "@stacks/network";
import { type TransactionEventsResponse } from "@stacks/stacks-blockchain-api-types";
import { createLogger } from "./logger";

const logger = createLogger("hiro-api");

export const fetchWrapper = async (path: string, network: StacksNetworkName) => {
    // TODO: Inject hiro api key
    const networkObj = networkFromName(network);
    const url = `${networkObj.client.baseUrl}${path}`;
    logger.info(url);
    return fetch(url);
}

export const getContractInfo = async (contractId: string, network: StacksNetworkName) => {
    return fetchWrapper(`/extended/v1/contract/${contractId}`, network).then(r => r.json())
}

export const getContractEvents = async (contractId: string, limit: number, offset: number, network: StacksNetworkName): Promise<TransactionEventsResponse> => {
    return fetchWrapper(`/extended/v1/contract/${contractId}/events?limit=${limit}&offset=${offset}`, network).then(r => r.json())
}