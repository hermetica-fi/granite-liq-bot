import { estimateSbtcToAeusdc as estimateSbtcToAeusdcAlex } from "./alex";
import { estimateSbtcToAeusdc as estimateSbtcToAeusdcBitflow } from "./bitflow";

const SWAPPER_ALEX = 1;
const SWAPPER_BITFLOW = 2;

export const estimateSbtcToAeusdc = async (sBtcAmount: number): Promise<{ swapper: number, out: number } | undefined> => {
    const results = await Promise.all([
        estimateSbtcToAeusdcAlex(sBtcAmount).then(r => ({ swapper: SWAPPER_ALEX, out: r })),
        estimateSbtcToAeusdcBitflow(sBtcAmount).then(r => ({ swapper: SWAPPER_BITFLOW, out: r }))
    ]);

    return results.sort((a, b) => b.out - a.out)[0];
}