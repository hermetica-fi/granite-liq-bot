import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { fetchFn } from "../client/hiro";
import { formatUnits, parseUnits } from "../units";

const getPriceSlippage = async (minterContract: string) => {
    return await fetchCallReadOnlyFunction({
        contractAddress: 'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG',
        contractName: 'minting-auto-v1',
        functionName: 'get-whitelist',
        functionArgs: [
            contractPrincipalCV(minterContract.split(".")[0], minterContract.split(".")[1]),
            contractPrincipalCV('SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4', 'sbtc-token'),
        ],
        senderAddress: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
        network: 'mainnet',
        client: {
            fetch: fetchFn,
        }
    }).then(r => Number(cvToJSON(r).value["price-slippage"].value));
}

export const estimateSbtcToUsdhMint = async (sBtcAmount: number, btcPriceBn: bigint, minterContract: string) => {
    const sBtcAmountBn = BigInt(parseUnits(sBtcAmount, 8));
    const priceSlippageBps = BigInt(await getPriceSlippage(minterContract));
    console.log(priceSlippageBps)
    const bpsBase = 10000n;
    const tokenBase = 100000000n; // 8 decimals same for: btc, pyth btc price, usdh
    const slippageAmount = (btcPriceBn * priceSlippageBps) / bpsBase;
    const numerator = sBtcAmountBn * (btcPriceBn - slippageAmount);
    const denominator = tokenBase * tokenBase;
    const mintableUsdh = (numerator * tokenBase) / denominator;

    return formatUnits(Number(mintableUsdh), 8);
}

