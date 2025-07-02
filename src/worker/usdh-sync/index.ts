import { getAssetBalance } from "../../client/read-only-call";
import { MARKET_ASSET, USE_USDH } from "../../constants";
import { getContractList } from "../../dba/contract";
import { setUsdhReserveBalanceLocal, setUsdhSafeTradeAmountLocal } from "../../dba/usdh";
import { createLogger } from "../../logger";
import type { ContractEntity } from "../../types";
import { epoch } from "../../util";
import { findMaxSafeTradeAmount } from "./lib";

const logger = createLogger("usdh-sync");

const USDH_RESERVE_CONTRACT = process.env.USDH_RESERVE_CONTRACT || "SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.redeeming-reserve-v1-1";

const lastSyncTs = {
    reserveBalance: 0,
    safeTradeAmount: 0,
}

const syncUsdhState = async (contract: ContractEntity) => {
    const now = epoch();

    if (lastSyncTs.reserveBalance < now - 1200) { // 20 mins
        const val = await getAssetBalance(MARKET_ASSET, USDH_RESERVE_CONTRACT);
        setUsdhReserveBalanceLocal(val);
        lastSyncTs.reserveBalance = now;
    }

    if (lastSyncTs.safeTradeAmount < now - 300) { // 5 mins
        const val = await findMaxSafeTradeAmount(contract.usdhThreshold / 10_000);
        setUsdhSafeTradeAmountLocal(val);
        lastSyncTs.safeTradeAmount = now;
    }
}

export const main = async () => {
    const contracts = (getContractList({}));
    if (contracts.length > 1) {
        throw new Error("Dev: Multiple contracts detected. Make usdh sync compatible.");
    }

    if (USE_USDH && contracts[0]) {
        await syncUsdhState(contracts[0]);
    }
}
