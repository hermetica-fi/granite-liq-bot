import { networkFromName } from "@stacks/network";
import { type TransactionEventsResponse } from "@stacks/stacks-blockchain-api-types";
import { createLogger } from "../logger";
import type { NetworkName } from "../types";

const logger = createLogger("hiro-api");

const MAX_RETRIES = 5;
const INITIAL_DELAY = 5000;

export const fetchWrapper = async (path: string, network: NetworkName) => {
    const networkObj = networkFromName(network);
    const url = `${networkObj.client.baseUrl}${path}`;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const r = await fetch(url);
            if (r.status === 200) {
                return r;
            }
            
            lastError = new Error(`HTTP ${r.status}: ${await r.text()}`);
            
            // Only retry if we haven't reached max attempts
            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                logger.error(`Hiro api request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            lastError = error as Error;
            
            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                logger.error(`Hiro api request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError || new Error('Request failed after max retries');
}

export const getContractInfo = async (contractId: string, network: NetworkName) => {
    return fetchWrapper(`/extended/v1/contract/${contractId}`, network).then(r => r.json())
}

export const getContractEvents = async (contractId: string, limit: number, offset: number, network: NetworkName): Promise<TransactionEventsResponse> => {
    return fetchWrapper(`/extended/v1/contract/${contractId}/events?limit=${limit}&offset=${offset}`, network).then(r => r.json())
}