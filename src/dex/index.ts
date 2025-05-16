import { estimateSbtcToAeusdc as estimateSbtcToAeusdcAlex } from "./alex";
import { estimateSbtcToAeusdc as estimateSbtcToAeusdcBitflow, estimateUsdhToToAeusdc } from "./bitflow";
import { estimateSbtcToUsdhMint } from "./hermetica";

const DEX_ALEX = 1;
const DEX_BITFLOW = 2;
export const DEX_USDH_FLASH_LOAN = 999;

export type SwapInfo = { dex: number, dy: number }

export const getDexNameById = (id: number) => {
    if (id === DEX_ALEX) {
        return "Alex";
    } else if (id === DEX_BITFLOW) {
        return "Bitflow";
    }

    throw new Error("unknown dex");
}

export const estimateSbtcToAeusdc = async (sBtcAmount: number, usdhContext?: {
    btcPriceBn: bigint,
    minterContract: string
}): Promise<SwapInfo> => {
    if (usdhContext) {
        const usdh = await estimateSbtcToUsdhMint(sBtcAmount, usdhContext.btcPriceBn, usdhContext.minterContract);
        const aeUsdc = await estimateUsdhToToAeusdc(usdh);
        return ({ dex: DEX_BITFLOW, dy: aeUsdc });
    }

    const results = await Promise.all([
        estimateSbtcToAeusdcAlex(sBtcAmount).then(r => ({ dex: DEX_ALEX, dy: r })),
        estimateSbtcToAeusdcBitflow(sBtcAmount).then(r => ({ dex: DEX_BITFLOW, dy: r }))
    ]);

    return results.sort((a, b) => b.dy - a.dy)[0];
}