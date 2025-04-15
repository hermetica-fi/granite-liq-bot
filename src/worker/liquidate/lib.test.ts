import { cvToJSON } from "@stacks/transactions";
import { describe, expect, test } from "bun:test";
import { options } from "../../alex";
import type { AssetInfoWithBalance, BorrowerStatusEntity, LiquidationBatch } from "../../types";
import { calcMinOut, liquidationBatchCv, makeLiquidationBatch, swapOutCv } from "./lib";


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

describe("swapOutCv", () => {
    test("option 0", () => {
        const cv = swapOutCv({ option: options[0], out: 100 });

        expect(cvToJSON(cv)).toEqual({
            "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional none)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional none)) (factor-w (optional none)))",
            "value": {

                "token-x": {
                    "type": "principal",
                    "value": "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc"
                },
                "token-y": {
                    "type": "principal",
                    "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2"
                },
                "token-z": {
                    "type": "(optional principal)",
                    "value": {
                        "type": "principal",
                        "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc"
                    }
                },
                "token-w": {
                    "type": "(optional none)",
                    "value": null
                },
                "token-v": {
                    "type": "(optional none)",
                    "value": null
                },
                "factor-x": {
                    "type": "uint",
                    "value": "100000000"
                },
                "factor-y": {
                    "type": "(optional uint)",
                    "value": {
                        "type": "uint",
                        "value": "100000000"
                    }
                },
                "factor-z": {
                    "type": "(optional none)",
                    "value": null
                },
                "factor-w": {
                    "type": "(optional none)",
                    "value": null
                }
            }
        })
    });

    /*
    disabled routes
    test("option 1", () => {
        const cv = swapOutCv({ option: options[1], out: 100 });

        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional none)))",
                "value": {
                    "token-x": {
                        "type": "principal",
                        "value": "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc"
                    },
                    "token-y": {
                        "type": "principal",
                        "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex"
                    },
                    "token-z": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2"
                        }
                    },
                    "token-w": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc"
                        }
                    },
                    "token-v": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "factor-x": {
                        "type": "uint",
                        "value": "100000000"
                    },
                    "factor-y": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-z": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-w": {
                        "type": "(optional none)",
                        "value": null
                    }
                }
            }
        })
    });

    test("option 2", () => {
        const cv = swapOutCv({ option: options[2], out: 100 });
        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional principal)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional uint))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional principal)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional uint)))",
                "value": {
                    "token-x": {
                        "type": "principal",
                        "value": "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc"
                    },
                    "token-y": {
                        "type": "principal",
                        "value": "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-abtc"
                    },
                    "token-z": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-susdt"
                        }
                    },
                    "token-w": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2"
                        }
                    },
                    "token-v": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc"
                        }
                    },
                    "factor-x": {
                        "type": "uint",
                        "value": "5000000"
                    },
                    "factor-y": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-z": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-w": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    }
                }
            }
        });
    })


    test("option 3", () => {
        const cv = swapOutCv({ option: options[3], out: 100 });
        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y (optional uint)) (factor-z (optional uint)) (factor-w (optional none)))",
                "value": {
                    "token-x": {
                        "type": "principal",
                        "value": "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc"
                    },
                    "token-y": {
                        "type": "principal",
                        "value": "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-abtc"
                    },
                    "token-z": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2"
                        }
                    },
                    "token-w": {
                        "type": "(optional principal)",
                        "value": {
                            "type": "principal",
                            "value": "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc"
                        }
                    },
                    "token-v": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "factor-x": {
                        "type": "uint",
                        "value": "5000000"
                    },
                    "factor-y": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-z": {
                        "type": "(optional uint)",
                        "value": {
                            "type": "uint",
                            "value": "100000000"
                        }
                    },
                    "factor-w": {
                        "type": "(optional none)",
                        "value": null
                    }
                }
            }
        });
    });
    */
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

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, collateralPrice, 10000000);
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

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, collateralPrice, 10000000);

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

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, collateralPrice, 10000000);
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

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, collateralPrice, 10000000);
        expect(batch).toEqual([
            {
                user: "ST3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBNNJCANK",
                liquidatorRepayAmount: 2000000000,
                minCollateralExpected: 22528
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
