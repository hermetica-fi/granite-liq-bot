export const generateDescendingPriceBuckets = (
    currentPrice: number,
    stepUsd: number = 100,
    count: number = 20,
    decimals: number = 8
): number[] => {
    const one = Math.pow(10, decimals); // 10^8
    const step = stepUsd * one;

    const start = Math.floor(currentPrice / step) * step;

    return Array.from({ length: count }, (_, i) => start - i * step);
}