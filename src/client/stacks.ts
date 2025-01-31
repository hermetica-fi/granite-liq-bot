import { contractPrincipalCV, cvToJSON, principalCV } from "@stacks/transactions";
import { CONTRACTS } from "../constants";
import type { AccrueInterestParams, BorrowerPositionEntity, CollateralParams, DebtParams, InterestRateParams, LpParams, NetworkName } from "../types";
import { callReadOnly } from "./hiro";


export const getIrParams = async (network: NetworkName): Promise<InterestRateParams> => {
  const [contractAddress, contractName] = CONTRACTS[network].ir.split(".");
  return callReadOnly({
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
  return callReadOnly({
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
  return callReadOnly({
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
  return callReadOnly({
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
  return callReadOnly({
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
      decimals: Number(json.value.value["decimals"].value),
      maxLTV: Number(json.value.value["max-ltv"].value)
    }
  })
};

export const getUserPosition = async (address: string, network: NetworkName): Promise<Pick<BorrowerPositionEntity,  'borrowedBlock' | 'debtShares' | 'collaterals'>> => {
  const [contractAddress, contractName] = CONTRACTS[network].state.split(".");
  return callReadOnly({
    contractAddress,
    contractName,
    functionName: "get-user-position",
    functionArgs: [
      principalCV(address),
    ],
    senderAddress: address,
    network
  }).then(r => {
    const json = cvToJSON(r);

    if (json.value === null) {
      return {
  
        borrowedBlock: 0,
        debtShares: 0,
        collaterals: []
      }
    };

    return {
      borrowedBlock: Number(json.value.value["borrowed-block"].value),
      debtShares: Number(json.value.value["debt-shares"].value),
      collaterals: json.value.value.collaterals.value.map((c: any) => c.value)
    }
  })
}

export const getUserCollateralAmount = async (address: string, collateral: string, network: NetworkName): Promise<number> => {
  const [contractAddress, contractName] = CONTRACTS[network].state.split(".");
  return callReadOnly({
    contractAddress,
    contractName,
    functionName: "get-user-collateral",
    functionArgs: [
      principalCV(address),
      contractPrincipalCV(collateral.split(".")[0], collateral.split(".")[1])
    ],
    senderAddress: address,
    network
  }).then(r => {
    const json = cvToJSON(r);
    return Number(json.value.value.amount.value);
  })
}
