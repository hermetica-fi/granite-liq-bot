import { estimateSbtcToAeusdc as estimateSbtcToAeusdcAlex } from "./alex";
import { estimateSbtcToAeusdc as estimateSbtcToAeusdcBitflow } from "./bitflow";

const DEX_ALEX = 1;
const DEX_BITFLOW = 2;

export const getDexNameById = (id: number) => {
    if(id === DEX_ALEX){
        return "Alex";
    } else if(id === DEX_BITFLOW){
        return "Bitflow";
    }

    throw new Error("unknown dex");
}

export const estimateSbtcToAeusdc = async (sBtcAmount: number): Promise<{ dex: number, out: number }> => {
    const results = await Promise.all([
        estimateSbtcToAeusdcAlex(sBtcAmount).then(r => ({ dex: DEX_ALEX, out: r })),
        estimateSbtcToAeusdcBitflow(sBtcAmount).then(r => ({ dex: DEX_BITFLOW, out: r }))
    ]);

    return results.sort((a, b) => b.out - a.out)[0];
}