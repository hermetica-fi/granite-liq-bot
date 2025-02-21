import type { Transaction } from "@stacks/stacks-blockchain-api-types";
import { cvToJSON, hexToCV } from "@stacks/transactions";

export const getLiquidatedPrincipals = (tx: Transaction) => {
    const res = [];

    if (tx.tx_type === "contract_call") {
        const batchHex = tx.contract_call.function_args?.find(x => x.name === 'batch')?.hex;
        if (batchHex) {
            const batches = cvToJSON(hexToCV(batchHex));

            if (batches) {
                for (const item of batches.value) {
                    const user = item?.value?.value?.user?.value;
                    if (user) {
                        res.push(user);
                    }
                }
            }
        }
    }
    
    return res;
}