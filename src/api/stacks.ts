import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { CONTRACTS } from "../constants";
import type { AccrueInterestParams, CollateralParams, DebtParams, InterestRateParams, LpParams, NetworkName } from "../types";

export const getIrParams = async (network: NetworkName): Promise<InterestRateParams> => {
    const [contractAddress, contractName] = CONTRACTS[network].ir.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-ir-params",
        functionArgs: [],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);
        return {
            baseIR: Number(json.value["base-ir"].value),
            slope1: Number(json.value["ir-slope-1"].value),
            slope2: Number(json.value["ir-slope-2"].value),
            urKink: Number(json.value["utilization-kink"].value),
        }
    })
}

export const getLpParams = async (network: NetworkName): Promise<LpParams> => {
    const [contractAddress, contractName] = CONTRACTS[network].state.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-lp-params",
        functionArgs: [],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);
        return {
            totalAssets: Number(json.value["total-assets"].value),
            totalShares: Number(json.value["total-shares"].value),
        }
    })
};

export const getAccrueInterestParams = async (network: NetworkName): Promise<AccrueInterestParams> => {
    const [contractAddress, contractName] = CONTRACTS[network].state.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-accrue-interest-params",
        functionArgs: [],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);

        return {
            lastAccruedBlockTime: Number(json.value.value["last-accrued-block-time"].value)
        }
    })
}

export const getDebtParams = async (network: NetworkName): Promise<DebtParams> => {
    const [contractAddress, contractName] = CONTRACTS[network].state.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-debt-params",
        functionArgs: [],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);

        return {
            openInterest: Number(json.value["open-interest"].value),
            totalDebtShares: Number(json.value["total-debt-shares"].value),
        }
    })
};

export const getCollateralParams = async (collateral: string, network: NetworkName): Promise<CollateralParams> => {
    const [contractAddress, contractName] = CONTRACTS[network].state.split(".");
    return fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-collateral",
        functionArgs: [
            contractPrincipalCV(collateral.split(".")[0], collateral.split(".")[1])
        ],
        senderAddress: contractAddress,
        network,
    }).then(r => {
        const json = cvToJSON(r);

        return {
            liquidationLTV: Number(json.value.value["liquidation-ltv"].value),
            decimals: Number(json.value.value["decimals"].value)
        }
    })
};