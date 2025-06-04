import { getAssetBalance } from "../../client/read-only-call";
import { MARKET_ASSET, USE_USDH } from "../../constants";
import { getUsdhState, setUsdhReserveBalance } from "../../dba/usdh";
import { createLogger } from "../../logger";
import { epoch } from "../../util";

const logger = createLogger("usdh-sync");

const USDH_RESERVE_CONTRACT = process.env.USDH_RESERVE_CONTRACT || "SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.redeeming-reserve-v1-1";

const lastSyncTs = {
    reserveBalance: 0,
    safeTradeAmount: 0,
}

const syncUsdhState = async () => {
    const now = epoch();

    if (lastSyncTs.reserveBalance < now - 600) { // 10 mins
        const val = await getAssetBalance(MARKET_ASSET, USDH_RESERVE_CONTRACT);
        setUsdhReserveBalance(val);
        lastSyncTs.reserveBalance = now;
    }
}

export const main = async () => {
    if (USE_USDH) {
        await syncUsdhState();
        const usdhState = getUsdhState();
        console.log(usdhState)
    }
}

