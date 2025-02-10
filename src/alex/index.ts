import { contractPrincipalCV, cvToJSON, deserializeCV, serializeCV, uintCV, type ClarityValue } from "@stacks/transactions";
import { parseUnits } from "granite-liq-bot-common";
import { batchContractRead, type ReadCall } from "../client/stxer";

const factor05 = uintCV(5000000);
const factor1 = uintCV(100000000);
const router = contractPrincipalCV('SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM', 'amm-pool-v2-01');

const aeUSDC = contractPrincipalCV("SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM", "token-waeusdc");
const stx = contractPrincipalCV("SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM", "token-wstx-v2");
const aBTC = contractPrincipalCV("SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK", "token-abtc");
const sBTC = contractPrincipalCV("SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC", "token-wsbtc");
const aUSD = contractPrincipalCV("SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK", "token-susdt");
const alex = contractPrincipalCV("SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM", "token-alex");

type SwapOption = { path: ClarityValue[], factors: ClarityValue[] }

const options: SwapOption[] = [
    {
        path: [sBTC, stx, aeUSDC],
        factors: [factor1, factor1]
    },
    {
        path: [sBTC, alex, stx, aeUSDC],
        factors: [factor1, factor1, factor1]
    },
    {
        path: [sBTC, aBTC, aUSD, stx, aeUSDC],
        factors: [factor05, factor1, factor1, factor1]
    },
    {
        path: [sBTC, aBTC, stx, aeUSDC],
        factors: [factor05, factor1, factor1]
    }
]

const dx = uintCV(parseUnits('0.01', 8));

const calls: ReadCall[] = options.map((option) => {
    let fn = ''
    if (option.path.length === 3) {
        fn = 'get-helper-a'
    } else if (option.path.length === 4) {
        fn = 'get-helper-b'
    } else if (option.path.length === 5) {
        fn = 'get-helper-c'
    }

    if (!fn) {
        throw new Error('Invalid path')
    }

    let functionArgs: ClarityValue[] = [
        ...option.path,
        ...option.factors,
        dx
    ];

    return [
        serializeCV(router),
        fn,
        ...functionArgs.map((v: any) => serializeCV(v))
    ]
});

const resp = await batchContractRead(calls);

const results: { option: SwapOption, out: number }[] = resp.map((r, i) => {
    if (r.Ok) {
        const cv = deserializeCV(r.Ok);
        if (cv.type === "err") {
            return { option: options[i], out: 0 };
        }

        return { option: options[i], out: Number(cvToJSON(cv).value.value) };
    }

    return { option: options[i], out: 0 };
}).sort((a, b) => b.out - a.out);

console.log(results[0].option.path, results[0].option.factors, results[0].out)
console.log(results[1].option.path, results[1].option.factors, results[1].out)
console.log(results[2].option.path, results[2].option.factors, results[2].out)
console.log(results[3].option.path, results[3].option.factors, results[3].out)
console.log(results[4].option.path, results[4].option.factors, results[4].out)