import { networkFromName, type StacksNetworkName } from "@stacks/network";
import type { AddressBalanceResponse, AddressNonces, MempoolTransaction, MempoolTransactionListResponse, Transaction, TransactionEventsResponse } from "@stacks/stacks-blockchain-api-types";

const TIMEOUT = 10000;
const MAX_RETRIES = 5;
const INITIAL_DELAY = 5000;
const HIRO_API_KEY = process?.env?.HIRO_API_KEY

export const fetchFn = async (
    input: string | URL,
    init?: RequestInit,
): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const _init = HIRO_API_KEY ? {
            ...init,
            headers: {
                ...init?.headers,
                'X-API-Key': HIRO_API_KEY
            }
        } : init;

        try {
            const r = await fetch(input, {
                ..._init,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if ([200, 404].includes(r.status)) {
                return r;
            }

            lastError = new Error(`HTTP ${r.status}: ${await r.text()}`);

            // Only retry if we haven't reached max attempts
            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                console.warn(`Hiro api error: ${lastError}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            lastError = error as Error;

            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                console.warn(`Hiro api error: ${lastError}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('Request failed after max retries');
}

export const fetchGetWrapper = async (path: string, network: StacksNetworkName) => {
    const networkObj = networkFromName(network);
    const url = `${networkObj.client.baseUrl}${path}`;
    return fetchFn(url);
}

export const getContractInfo = async (contractId: string, network: StacksNetworkName) => {
    return fetchGetWrapper(`/extended/v1/contract/${contractId}`, network).then(r => r.json())
}

export const getContractEvents = async (contractId: string, limit: number, offset: number, network: StacksNetworkName): Promise<TransactionEventsResponse> => {
    return fetchGetWrapper(`/extended/v1/contract/${contractId}/events?limit=${limit}&offset=${offset}`, network).then(r => r.json())
}

export const getAccountBalances = async (principal: string, network: StacksNetworkName): Promise<AddressBalanceResponse> => {
    return fetchGetWrapper(`/extended/v1/address/${principal}/balances`, network).then(r => r.json())
}

export const getAccountNonces = async (principal: string, network: StacksNetworkName): Promise<AddressNonces> => {
    return fetchGetWrapper(`/extended/v1/address/${principal}/nonces`, network).then(r => r.json());
}

export const getTransaction = async (txId: string, network: StacksNetworkName): Promise<Transaction | MempoolTransaction> => {
    return fetchGetWrapper(`/extended/v1/tx/${txId}`, network).then(r => r.json());
}

export const getMempoolTransactions = async (limit: number, network: StacksNetworkName): Promise<MempoolTransactionListResponse> => {
    return fetchGetWrapper(`/extended/v1/tx/mempool?limit=${limit}`, network).then(r => r.json());
}