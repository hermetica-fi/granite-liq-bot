import assert from "assert";
import { calculateAccountHealth, convertDebtSharesToAssets } from "granite-math-sdk";
import { IR_PARAMS_SCALING_FACTOR, SCALING_FACTOR } from "../../constants";
import { pool } from "../../db";
import type { InterestRateParams, NetworkName, PriceFeed } from "../../types";
import { getMarketState } from "../market-sync/shared";
import { getBorrowersForHealthCheck, getUserCollateralAmount, updateBorrowerHealth } from "./shared";


const getCollateralPrice = (collateral: string, priceFeed: PriceFeed): number => {
  for (const f of Object.keys(priceFeed)) {
    const name = collateral.split(".")[1];
    if (name.toLocaleLowerCase().includes(f.toLocaleLowerCase())) {
      return priceFeed[f as keyof PriceFeed];
    }
  }
  return 0;
}

export const main = async () => {
  const dbClient = await pool.connect();
  const borrowers = await getBorrowersForHealthCheck(dbClient);
  for (const borrower of borrowers) {
    const marketState = await getMarketState(dbClient, borrower.network as NetworkName);
    if (!marketState) {
      throw new Error("No market state found");
    }

    const collateralTokensDeposited: Record<string, number> = {}

    for (const collateral of borrower.collaterals) {
      const amount = await getUserCollateralAmount(dbClient, borrower.address, collateral);
      assert(amount !== undefined, "User collateral amount is undefined");
      collateralTokensDeposited[collateral] = amount;
    }


    const irParamsInput: InterestRateParams = {
      urKink: marketState.irParams.urKink / 10 ** IR_PARAMS_SCALING_FACTOR,
      baseIR: marketState.irParams.baseIR / 10 ** IR_PARAMS_SCALING_FACTOR,
      slope1: marketState.irParams.slope1 / 10 ** IR_PARAMS_SCALING_FACTOR,
      slope2: marketState.irParams.slope2 / 10 ** IR_PARAMS_SCALING_FACTOR,
    };

    const currentDebt = convertDebtSharesToAssets(
      borrower.debtShares / 10 ** SCALING_FACTOR,
      marketState.debtParams.openInterest / 10 ** SCALING_FACTOR,
      marketState.debtParams.totalDebtShares / 10 ** SCALING_FACTOR,
      marketState.lpParams.totalAssets / 10 ** SCALING_FACTOR,
      irParamsInput,
      marketState.accrueInterestParams.lastAccruedBlockTime,
    );

    console.log("borrower", borrower);
    console.log("currentDebt", currentDebt);

    if (currentDebt === 0) {
      await updateBorrowerHealth(dbClient, borrower.address, 0);
      console.log("-------------------------------------------------");
      continue
    }

    const collaterals = Object.keys(collateralTokensDeposited).map(key => {
      const { decimals, liquidationLTV } = marketState.collateralParams[key];
      const price = getCollateralPrice(key, marketState.priceFeed);

      if (!price) {
        throw new Error(`No price found for ${key}`);
      }

      return {
        amount: collateralTokensDeposited[key] / 10 ** decimals,
        price: price / 10 ** decimals,
        liquidationLTV: liquidationLTV / 10 ** decimals,
      }
    });

    console.log("collaterals", collaterals);

    const health = calculateAccountHealth(collaterals, currentDebt);

    await updateBorrowerHealth(dbClient, borrower.address, health);

    console.log("health", health);
    console.log("-------------------------------------------------");
  }
};


main()