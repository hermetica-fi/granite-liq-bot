import { cvToJSON, fetchCallReadOnlyFunction, principalCV, uintCV } from "@stacks/transactions";
import { fetchFn, type NetworkName } from "granite-liq-bot-common";
import { CONTRACTS } from "./constants";


const getUserPosition = async (address: string, network: NetworkName): Promise<any> => {
    const [contractAddress, contractName] = CONTRACTS[network].state.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-user-position",
        functionArgs: [
            principalCV(address),
        ],
        senderAddress: address,
        network,
        client: {
            fetch: fetchFn,
        }
    }).then(r => {
        const json = cvToJSON(r);

        if (json.value === null) {
            return {
                debtShares: 0,
                collaterals: []
            }
        };

        return {
            debtShares: BigInt(json.value.value["debt-shares"].value),
            collaterals: json.value.value.collaterals.value.map((c: any) => c.value)
        }
    })
}

const USER = "SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7";

const userPosition = await getUserPosition(USER, "mainnet");

const convertToAssets = async (shares: number, network: NetworkName): Promise<any> => {
    const [contractAddress, contractName] = CONTRACTS[network].state.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "convert-to-assets",
        functionArgs: [
            uintCV(shares),
        ],
        senderAddress: contractAddress,
        network,
        client: {
            fetch: fetchFn,
        }
    }).then(r => {
        const json = cvToJSON(r);

        return BigInt(json.value)
    })
}

const debt = await convertToAssets(Number(userPosition.debtShares), "mainnet");

console.log("debt: ", debt )