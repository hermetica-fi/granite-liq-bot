import { cvToJSON } from "@stacks/transactions";
import { describe, expect, test } from "bun:test";
import type { AssetInfoWithBalance, BorrowerStatusEntity, LiquidationBatch } from "../../types";
import { calcMinOut, liquidationBatchCv, makeLiquidationBatch, makeLiquidationTxOptions } from "./lib";



test("liquidationBatchCv", () => {
    const batch: LiquidationBatch[] = [
        {
            user: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
            liquidatorRepayAmount: 20000000000,
            minCollateralExpected: 205455
        },
        {
            user: "ST29Z7DDEPKNBP9Y17SDG3AQZMWKGS722M77HN9WR",
            liquidatorRepayAmount: 10000000000,
            minCollateralExpected: 105455
        }
    ];

    expect(cvToJSON(liquidationBatchCv(batch))).toEqual({
        "type": "(list 2 (optional (tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint))))",
        "value": [
            {
                "type": "(optional (tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint)))",
                "value": {
                    "type": "(tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint))",
                    "value": {
                        "user": {
                            "type": "principal",
                            "value": "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW"
                        },
                        "liquidator-repay-amount": {
                            "type": "uint",
                            "value": "20000000000"
                        },
                        "min-collateral-expected": {
                            "type": "uint",
                            "value": "205455"
                        }
                    }
                }
            },
            {
                "type": "(optional (tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint)))",
                "value": {
                    "type": "(tuple (user principal) (liquidator-repay-amount uint) (min-collateral-expected uint))",
                    "value": {
                        "user": {
                            "type": "principal",
                            "value": "ST29Z7DDEPKNBP9Y17SDG3AQZMWKGS722M77HN9WR"
                        },
                        "liquidator-repay-amount": {
                            "type": "uint",
                            "value": "10000000000"
                        },
                        "min-collateral-expected": {
                            "type": "uint",
                            "value": "105455"
                        }
                    }
                }
            }
        ]
    });
});

describe("makeLiquidationBatch", () => {

    const collateralPrice = 9765295458695;

    let marketAsset: AssetInfoWithBalance = {
        "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc",
        "name": "mock-usdc",
        "symbol": "mock-usdc",
        "decimals": 8,
        "balance": 2000000000
    };

    let collateralAsset: AssetInfoWithBalance = {
        "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc",
        "name": "mock-btc",
        "symbol": "mock-btc",
        "decimals": 8,
        "balance": 0
    };

    test("20 usdc is available, 1 borrower", () => {

        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 2.125664850930649,
                },
                totalRepayAmount: 2.125664850930649,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, 0, borrowers, collateralPrice, 10000000);
        expect(batch).toEqual({
            batch: [
                {
                    user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                    liquidatorRepayAmount: 212500000,
                    minCollateralExpected: 2393
                }
            ],
            spendBn: 212500000,
            spend: 2.125,
            receiveBn: 2393,
            receive: 0.00002393
        });
    });

    test("20 usdc is available, 2 borrowers", () => {
        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 2.125664850930649,
                },
                totalRepayAmount: 2.125664850930649,
            },
            {
                address: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 4.623614857930649,
                },
                totalRepayAmount: 4.623614857930649,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, 0, borrowers, collateralPrice, 10000000);

        expect(batch).toEqual({
            batch: [
                {
                    user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                    liquidatorRepayAmount: 212500000,
                    minCollateralExpected: 2393,
                }, {
                    user: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                    liquidatorRepayAmount: 462300000,
                    minCollateralExpected: 5207,
                }
            ],
            spendBn: 674800000,
            spend: 6.748,
            receiveBn: 7600,
            receive: 0.000076
        });
    });

    test("20 usdc is available, 3 borrowers, should not cover 3rd borrower's full repay amount", () => {
        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 2.125664850930649,
                },
                totalRepayAmount: 2.125664850930649,
            },
            {
                address: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 4.623614857930649,
                },
                totalRepayAmount: 4.623614857930649,
            },
            {
                address: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 17.9313224,
                },
                totalRepayAmount: 17.9313224,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, 0, borrowers, collateralPrice, 10000000);
        expect(batch).toEqual({
            batch: [
                {
                    user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                    liquidatorRepayAmount: 212500000,
                    minCollateralExpected: 2393,
                }, {
                    user: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                    liquidatorRepayAmount: 462300000,
                    minCollateralExpected: 5207,
                }, {
                    user: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
                    liquidatorRepayAmount: 1325200000,
                    minCollateralExpected: 14927,
                }
            ],
            spendBn: 2000000000,
            spend: 20,
            receiveBn: 22527,
            receive: 0.00022527
        });
    });

    test("20 usdc is available, 3 borrowers, should only cover the first borrower's partial repay amount", () => {
        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 21.125664850930649,
                },
                totalRepayAmount: 21.125664850930649,
            },
            {
                address: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 4.623614857930649,
                },
                totalRepayAmount: 4.623614857930649,
            },
            {
                address: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 17.9313224,
                },
                totalRepayAmount: 17.9313224,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, 0, borrowers, collateralPrice, 10000000);
        expect(batch).toEqual({
            batch: [
                {
                    user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                    liquidatorRepayAmount: 2000000000,
                    minCollateralExpected: 22528
                }
            ],
            spendBn: 2000000000,
            spend: 20,
            receiveBn: 22528,
            receive: 0.00022528
        })
    });


    test("20 usdc is available, 3 borrowers, should cover all with + 60 usdc flash loan capacity", () => {
        const borrowers: BorrowerStatusEntity[] = [
            {
                address: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 21.125664850930649,
                },
                totalRepayAmount: 21.125664850930649,
            },
            {
                address: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 4.623614857930649,
                },
                totalRepayAmount: 4.623614857930649,
            },
            {
                address: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
                ltv: 0.5038,
                health: 0.9726,
                debt: 35.7413,
                collateral: 70.9416,
                risk: 1.0282,
                maxRepay: {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 17.9313224,
                },
                totalRepayAmount: 17.9313224,
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, 60_00000000, borrowers, collateralPrice, 10000000);
        expect(batch).toEqual({
            batch: [
                {
                    user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                    liquidatorRepayAmount: 2112500000,
                    minCollateralExpected: 23796
                },
                {
                    liquidatorRepayAmount: 462300000,
                    minCollateralExpected: 5207,
                    user: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                },
                {
                    liquidatorRepayAmount: 1793100000,
                    minCollateralExpected: 20198,
                    user: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
                }
            ],
            spendBn: 4367900000,
            spend: 43.679,
            receiveBn: 49201,
            receive: 0.00049201,
        })
    });

});

test("calcMinOut", () => {
    expect(calcMinOut(155000, 0)).toEqual(155000);
    expect(calcMinOut(155000, 10)).toEqual(154845); // %0,1
    expect(calcMinOut(155000, 100)).toEqual(153450); // %1
    expect(calcMinOut(155000, 1500)).toEqual(131750); // %15
    expect(calcMinOut(155000, 9000)).toEqual(15500); // %90
    expect(calcMinOut(155000, 10000)).toEqual(0); // %100
});

describe("makeLiquidationTxOptions", () => {
    const contract = {
        id: "SPT4BE98XGF7NSWV1V0ZK1YMS0KQ0A6X2X8EJ5EM.liquidator",
        address: "SPT4BE98XGF7NSWV1V0ZK1YMS0KQ0A6X2X8EJ5EM",
        name: "liquidator",
        operatorAddress: "SPT4BE98XGF7NSWV1V0ZK1YMS0KQ0A6X2X8EJ5EM",
        operatorBalance: 475588,
        marketAsset: {
            address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
            name: "Ethereum USDC via Allbridge",
            symbol: "aeUSDC",
            decimals: 6,
            balance: 2637992,
        },
        collateralAsset: {
            address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
            name: "sBTC",
            symbol: "sBTC",
            decimals: 8,
            balance: 1,
        },
        unprofitabilityThreshold: 0,
        flashLoanSc: {
            address: "SPT4BE98XGF7NSWV1V0ZK1YMS0KQ0A6X2X8EJ5EM",
            name: "flash-loan-v1",
        },
        lockTx: null,
        unlocksAt: null,
    }

    const priv = "priv";
    const nonce = 2;
    const fee = 50000;
    const batchInfo = {
        batch: [
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 2112500000,
                minCollateralExpected: 23796
            },
            {
                liquidatorRepayAmount: 462300000,
                minCollateralExpected: 5207,
                user: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
            },
            {
                liquidatorRepayAmount: 1793100000,
                minCollateralExpected: 20198,
                user: "ST2VWSP59FEVDXXYGGWYG90M3N67ZST2AGPA3P2HC",
            }
        ],
        spendBn: 4367900000,
        spend: 43.679,
        receiveBn: 49201,
        receive: 0.00049201,
    }

    const priceFeed = {
        "attestation": "504e41550100000003b",
        "items": {
            "btc": {
                "id": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
                "price": {
                    "price": "10384556671615",
                    "conf": "3561855687",
                    "expo": -8,
                    "publish_time": 1747405182
                },
                "ema_price": {
                    "price": "10372757800000",
                    "conf": "3972950400",
                    "expo": -8,
                    "publish_time": 1747405182
                },
                "metadata": {
                    "slot": 217289634,
                    "proof_available_time": 1747405183,
                    "prev_publish_time": 1747405181
                }
            },
            "usdc": {
                "id": "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
                "price": {
                    "price": "99993806",
                    "conf": "50216",
                    "expo": -8,
                    "publish_time": 1747405182
                },
                "ema_price": {
                    "price": "99989672",
                    "conf": "63697",
                    "expo": -8,
                    "publish_time": 1747405182
                },
                "metadata": {
                    "slot": 217289634,
                    "proof_available_time": 1747405183,
                    "prev_publish_time": 1747405181
                }
            }
        }
    }

    const swap = { dex: 2, dy: 1000 };

    test("normal dex liquidation", () => {
        const txOptions = makeLiquidationTxOptions({
            contract,
            priv,
            nonce,
            fee,
            batchInfo,
            priceFeed,
            swap,
            useFlashLoan: false,
            useUsdh: false,
        });
    
        expect(txOptions).toMatchSnapshot();
    })
});

