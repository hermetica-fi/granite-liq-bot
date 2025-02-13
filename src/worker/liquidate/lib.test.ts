import { cvToJSON } from "@stacks/transactions";
import { describe, expect, test } from "bun:test";
import type { AssetInfo, BorrowerStatusEntity } from "granite-liq-bot-common";
import { options } from "../../alex";
import type { PriceFeedResponse } from "../../client/pyth";
import type { LiquidationBatch } from "../../types";
import { liquidationBatchCv, makeLiquidationBatch, swapOutCv } from "./lib";


test("liquidationBatchCv", () => {
    const batch: LiquidationBatch[] = [
        {
            user: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
            liquidatorRepayAmount: 20000000000,
            minCollateralExpected: 205455,
        },
        {
            user: "ST29Z7DDEPKNBP9Y17SDG3AQZMWKGS722M77HN9WR",
            liquidatorRepayAmount: 10000000000,
            minCollateralExpected: 105455,
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
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional none)) (token-v (optional none)) (factor-x uint) (factor-y uint) (factor-z (optional none)) (factor-w (optional none)) (factor-v (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional none)) (token-v (optional none)) (factor-x uint) (factor-y uint) (factor-z (optional none)) (factor-w (optional none)) (factor-v (optional none)))",
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
                        "type": "uint",
                        "value": "100000000"
                    },
                    "factor-z": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "factor-w": {
                        "type": "(optional none)",
                        "value": null
                    },
                    "factor-v": {
                        "type": "(optional none)",
                        "value": null
                    }
                }
            }
        })
    });



    test("option 1", () => {
        const cv = swapOutCv({ option: options[1], out: 100 });

        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y uint) (factor-z (optional uint)) (factor-w (optional none)) (factor-v (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y uint) (factor-z (optional uint)) (factor-w (optional none)) (factor-v (optional none)))",
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
                        "type": "uint",
                        "value": "100000000"
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
                    },
                    "factor-v": {
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
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional principal)) (factor-x uint) (factor-y uint) (factor-z (optional uint)) (factor-w (optional uint)) (factor-v (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional principal)) (factor-x uint) (factor-y uint) (factor-z (optional uint)) (factor-w (optional uint)) (factor-v (optional none)))",
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
                        "type": "uint",
                        "value": "100000000"
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
                    },
                    "factor-v": {
                        "type": "(optional none)",
                        "value": null
                    }
                }
            }
        });
    })


    test("option 3", () => {
        const cv = swapOutCv({ option: options[3], out: 100 });
        expect(cvToJSON(cv)).toEqual({
            "type": "(optional (tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y uint) (factor-z (optional uint)) (factor-w (optional none)) (factor-v (optional none))))",
            "value": {
                "type": "(tuple (token-x principal) (token-y principal) (token-z (optional principal)) (token-w (optional principal)) (token-v (optional none)) (factor-x uint) (factor-y uint) (factor-z (optional uint)) (factor-w (optional none)) (factor-v (optional none)))",
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
                        "type": "uint",
                        "value": "100000000"
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
                    },
                    "factor-v": {
                        "type": "(optional none)",
                        "value": null
                    }
                }
            }
        });
    });
});


describe("makeLiquidationBatch", () => {

    let borrowers: BorrowerStatusEntity[] = [
        {
            "address": "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
            "network": "testnet",
            "ltv": 0.8263,
            "health": 0.8688,
            "debt": 560981.3451,
            "collateral": 678929.1726,
            "risk": 1.151,
            "maxRepay": {
                "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 560983.4133
            },
            "totalRepayAmount": 560983.4133
        },
        {
            "address": "ST2N7SK0W83NJSZHFH8HH31ZT3DXJG7NFE6Y058RD",
            "network": "testnet",
            "ltv": 0.8558,
            "health": 0.9348,
            "debt": 416664.4053,
            "collateral": 486847.8102,
            "risk": 1.0698,
            "maxRepay": {
                "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 416665.9415
            },
            "totalRepayAmount": 416665.9415
        },
        {
            "address": "STBWK9266APRKQ6GGKPAXZT99QGA41RZ67PD1EKK",
            "network": "testnet",
            "ltv": 0.803,
            "health": 0.9963,
            "debt": 109463.0758,
            "collateral": 136320.4674,
            "risk": 1.0037,
            "maxRepay": {
                "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 109463.4794
            },
            "totalRepayAmount": 109463.4794
        }
    ];

    const priceFeed: PriceFeedResponse = {
        "attestation": "0",
        "items": {
            "btc": {
                "id": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
                "price": {
                    "price": "9765295458695",
                    "conf": "5047541305",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "ema_price": {
                    "price": "9743841500000",
                    "conf": "4409028900",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "metadata": {
                    "slot": 196479356,
                    "proof_available_time": 1738927846,
                    "prev_publish_time": 1738927845
                }
            },
            "eth": {
                "id": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
                "price": {
                    "price": "275485757702",
                    "conf": "164804380",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "ema_price": {
                    "price": "274507820000",
                    "conf": "135476227",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "metadata": {
                    "slot": 196479356,
                    "proof_available_time": 1738927846,
                    "prev_publish_time": 1738927845
                }
            },
            "usdc": {
                "id": "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
                "price": {
                    "price": "99995023",
                    "conf": "112805",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "ema_price": {
                    "price": "99996136",
                    "conf": "111950",
                    "expo": -8,
                    "publish_time": 1738927845
                },
                "metadata": {
                    "slot": 196479356,
                    "proof_available_time": 1738927846,
                    "prev_publish_time": 1738927845
                }
            }
        }
    }

    let marketAsset: AssetInfo = {
        "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc",
        "name": "mock-usdc",
        "symbol": "mock-usdc",
        "decimals": 8,
        "balance": 20000000000
    };

    let collateralAsset: AssetInfo = {
        "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc",
        "name": "mock-btc",
        "symbol": "mock-btc",
        "decimals": 8,
        "balance": 0
    };

    test("200 usdc is available. should have one liquidation", () => {
        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);

        expect(batch).toEqual([
            {
                user: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                liquidatorRepayAmount: 20000000000,
                minCollateralExpected: 204807,
            }
        ]);
    });

    test("0 usdc is available. should have one liquidation", () => {
        marketAsset = {
            "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc",
            "name": "mock-usdc",
            "symbol": "mock-usdc",
            "decimals": 8,
            "balance": 0
        };
        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);
        expect(batch).toEqual([]);
    });

    test("6280 usdc is available. should have two liquidations + only pick from correct collateral", () => {
        marketAsset = {
            "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc",
            "name": "mock-usdc",
            "symbol": "mock-usdc",
            "decimals": 8,
            "balance": 628000000000
        };

        borrowers = [
            {
                "address": "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                "network": "testnet",
                "ltv": 0.8263,
                "health": 0.8688,
                "debt": 560981.3451,
                "collateral": 678929.1726,
                "risk": 1.151,
                "maxRepay": {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 5983.4133,
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": 100.1
                },
                "totalRepayAmount": 6083.5133
            },
            {
                "address": "ST2N7SK0W83NJSZHFH8HH31ZT3DXJG7NFE6Y058RD",
                "network": "testnet",
                "ltv": 0.8558,
                "health": 0.9348,
                "debt": 416664.4053,
                "collateral": 486847.8102,
                "risk": 1.0698,
                "maxRepay": {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 321.9415
                },
                "totalRepayAmount": 321.9415
            },
            {
                "address": "STBWK9266APRKQ6GGKPAXZT99QGA41RZ67PD1EKK",
                "network": "testnet",
                "ltv": 0.803,
                "health": 0.9963,
                "debt": 109463.0758,
                "collateral": 136320.4674,
                "risk": 1.0037,
                "maxRepay": {
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 110.4794
                },
                "totalRepayAmount": 110.4794
            }
        ];

        const batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);

        expect(batch).toEqual([
            {
                user: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                liquidatorRepayAmount: 598300000000,
                minCollateralExpected: 6126799,
            }, {
                user: "ST2N7SK0W83NJSZHFH8HH31ZT3DXJG7NFE6Y058RD",
                liquidatorRepayAmount: 29700000000,
                minCollateralExpected: 304138,
            }
        ]
        );
    });
});