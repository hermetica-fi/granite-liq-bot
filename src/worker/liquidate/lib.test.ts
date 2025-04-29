import { cvToJSON } from "@stacks/transactions";
import { describe, expect, test } from "bun:test";
import type { AssetInfoWithBalance, BorrowerStatusEntity, LiquidationBatch } from "../../types";
import { calcMinOut, liquidationBatchCv, makeLiquidationBatch } from "./lib";



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
        expect(batch).toEqual([
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 212500000,
                minCollateralExpected: 2393
            }
        ]);
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

        expect(batch).toEqual([
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 212500000,
                minCollateralExpected: 2393,
            }, {
                user: "ST2DXHX9Q844EBT80DYJXFWXJKCJ5FFAX53H4AZFA",
                liquidatorRepayAmount: 462300000,
                minCollateralExpected: 5207,
            }
        ]);
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
        expect(batch).toEqual([
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
        ]);
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
        expect(batch).toEqual([
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 2000000000,
                minCollateralExpected: 22528
            }
        ])
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
        expect(batch).toEqual([
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
        ])
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
