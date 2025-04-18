import { contractPrincipalCV, cvToJSON, deserializeCV, serializeCV, uintCV } from "@stacks/transactions";
import { batchContractRead, type ReadCall } from "../client/stxer";
import { formatUnits, parseUnits } from "../units";

export const estimateSbtcToAeusdc = async (sBtcAmount: number) => {
    const call: ReadCall = [
        serializeCV(contractPrincipalCV('SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM', 'amm-pool-v2-01')),
        'get-helper-a',
        serializeCV(contractPrincipalCV("SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC", "token-wsbtc")),
        serializeCV(contractPrincipalCV("SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM", "token-wstx-v2")),
        serializeCV(contractPrincipalCV("SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM", "token-waeusdc")),
        serializeCV(uintCV(100000000)),
        serializeCV(uintCV(100000000)),
        serializeCV(uintCV(parseUnits(sBtcAmount, 8)))
    ]
    const resp = await batchContractRead([call]);

    if (resp[0] && resp[0].Ok) {
        const js = cvToJSON(deserializeCV(resp[0].Ok));
        if (js.success) {
            return formatUnits(js.value.value, 8);
        }
    }

    return 0;
}