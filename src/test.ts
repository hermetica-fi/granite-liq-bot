import { convertDebtSharesToAssets } from "granite-math-sdk";
import { IR_PARAMS_SCALING_FACTOR, SCALING_FACTOR } from "./constants";
import { pool } from "./db";
import { getMarketState } from "./market-state-tracker/lib";
import type { InterestRateParams } from "./types";

const dbClient = await pool.connect();

const marketState = await getMarketState(dbClient, "mainnet");
if(!marketState) {
    throw new Error("No market state found");
}

const irParamsInput: InterestRateParams = {
    urKink: marketState.irParams.urKink / 10 ** IR_PARAMS_SCALING_FACTOR,
    baseIR: marketState.irParams.baseIR / 10 ** IR_PARAMS_SCALING_FACTOR,
    slope1: marketState.irParams.slope1 / 10 ** IR_PARAMS_SCALING_FACTOR,
    slope2: marketState.irParams.slope2 / 10 ** IR_PARAMS_SCALING_FACTOR,
  };



const borrower = {
    debtShares: 99850540,
    collateralTokensDeposited: {
        'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token': 1000
    }
}


const currentDebt = convertDebtSharesToAssets(
    borrower.debtShares / 10 ** SCALING_FACTOR,
    marketState.debtParams.openInterest / 10 ** SCALING_FACTOR,
    marketState.debtParams.totalDebtShares / 10 ** SCALING_FACTOR,
    marketState.lpParams.totalAssets / 10 ** SCALING_FACTOR,
    irParamsInput,
    marketState.accrueInterestParams.lastAccruedBlockTime,
  );

  console.log(currentDebt)