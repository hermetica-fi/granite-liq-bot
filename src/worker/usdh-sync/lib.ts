import { estimateUsdhToToAeusdc } from "../../dex/bitflow";

export const findMaxSafeTradeAmount = async (priceThreshold = 0.9975) => {
    let low = 0;
    let high = 1000000; // Start with $1M USD max
    let maxSafeAmount = 0;
    const tolerance = 100; // $100 USD tolerance

    while (high - low > tolerance) {
        const mid = Math.floor((low + high) / 2);

        const quote = await estimateUsdhToToAeusdc(mid);

        const inputAmountUSD = mid;
        const outputAmountUSD = quote;
        const effectivePrice = outputAmountUSD / inputAmountUSD;

        if (effectivePrice >= priceThreshold) {
            // Price is above threshold, try larger amount
            maxSafeAmount = mid;
            low = mid + 1;
        } else {
            // Price below threshold, try smaller amount
            high = mid - 1;
        }
    }

    return maxSafeAmount;
}