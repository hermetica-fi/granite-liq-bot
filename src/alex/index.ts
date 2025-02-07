import { contractPrincipalCV, cvToJSON, deserializeCV, serializeCV, uintCV, type ClarityValue } from "@stacks/transactions";

const factor05 = uintCV(5000000);
const factor1 = uintCV(100000000);
const router = contractPrincipalCV('SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM', 'amm-pool-v2-01');

const aeUSDC = contractPrincipalCV("SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM", "token-waeusdc");
const stx = contractPrincipalCV("SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM", "token-wstx-v2");
const aBTC = contractPrincipalCV("SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK", "token-abtc");
const sBTC = contractPrincipalCV("SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC", "token-wsbtc");
const aUSD = contractPrincipalCV("SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK", "token-susdt");
const alex = contractPrincipalCV("SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM", "token-alex");


const options = [
    {
        path: [aeUSDC, stx, sBTC],
        factors: [factor1, factor1]
    },
    {
        path: [aeUSDC, stx, alex, sBTC],
        factors: [factor1, factor1, factor1]
    },
    {
        path: [aeUSDC, stx, aUSD, aBTC, sBTC],
        factors: [factor1, factor1, factor1, factor05]
    },
    {
        path: [aeUSDC, stx, aBTC, sBTC],
        factors: [factor1, factor1, factor05]
    },
    {
        path: [aeUSDC, stx, alex, sBTC],
        factors: [factor1, factor1, factor1]
    },
]

const dx = uintCV(1000_00000000);

const calls: any[] = options.map((option) => {

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

const response = await fetch('https://api.stxer.xyz/sidecar/v2/batch', {
    method: 'POST',
    body: JSON.stringify({
        readonly: calls
    }),
    headers: {
        'Content-Type': 'application/json',
    },
}).then(r => r.json());

const okResults = response.readonly.map((c: any) => {
    return c["Ok"];
});



const results = okResults.map((r: any) => {
    if (!r) {
        return 0;
    }
    const cv = deserializeCV(r);
    if (cv.type === "err") {
        return 0;
    }
    return Number(cvToJSON(deserializeCV(r)).value.value);
});

console.log(results);