export function formatUnits(
    amount: number,
    decimals: number
  ): number {
    if (amount === 0) return 0;
    return amount / Math.pow(10, decimals);
  }
  
  export const parseUnits = (
    amount: string | number | bigint,
    decimals: number
  ) => {
    return Number(amount) * Math.pow(10, decimals);
  };