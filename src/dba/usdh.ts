import assert from "assert";
import { kvStoreGet, kvStoreSet } from "../db/helper";

export const getUsdhReserveBalanceLocal = (): string | null => {
    return kvStoreGet(`usdh-reserve-balance`) || null;
}

export const setUsdhReserveBalanceLocal = (balance: string | number) => {
    kvStoreSet(`usdh-reserve-balance`, balance);
}

export const getUsdhSafeTradeAmountLocal = (): string | null => {
    return kvStoreGet(`usdh-safe-trade-amount`) || null;
}

export const setUsdhSafeTradeAmountLocal = (amount: string | number) => {
    kvStoreSet(`usdh-safe-trade-amount`, amount);
}

export const getUsdhState = () => {
    const usdhReserveBalance = getUsdhReserveBalanceLocal();
    assert(usdhReserveBalance, 'usdhReserveBalance not found');
    
    const usdhSafeTradeAmount = getUsdhSafeTradeAmountLocal();
    assert(usdhSafeTradeAmount, 'usdhSafeTradeAmount not found');

    return {
        reserveBalance: Number(usdhReserveBalance),
        safeTradeAmount: Number(usdhSafeTradeAmount)
    }
}

