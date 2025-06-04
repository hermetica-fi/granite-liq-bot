import assert from "assert";
import { kvStoreGet, kvStoreSet } from "../db/helper";

export const getUsdhReserveBalance = (): string | null => {
    return kvStoreGet(`usdh-reserve-balance`) || null;
}

export const setUsdhReserveBalance = (balance: string | number) => {
    kvStoreSet(`usdh-reserve-balance`, balance);
}

export const getUsdhSafeTradeAmount = (): string | null => {
    return kvStoreGet(`usdh-safe-trade-amount`) || null;
}

export const setUsdhSafeTradeAmount = (amount: string | number) => {
    kvStoreSet(`usdh-safe-trade-amount`, amount);
}


export const getUsdhState = () => {
    const usdhReserveBalance = getUsdhReserveBalance();
    assert(usdhReserveBalance, 'usdhReserveBalance not found');
    
    const usdhSafeTradeAmount = getUsdhSafeTradeAmount();
    assert(usdhSafeTradeAmount, 'usdhSafeTradeAmount not found');

    return {
        reserveBalance: Number(usdhReserveBalance),
        safeTradeAmount: Number(usdhSafeTradeAmount)
    }
}

