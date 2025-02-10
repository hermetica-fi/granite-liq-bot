import { cvToJSON } from "@stacks/transactions";
import { describe, expect, test } from "bun:test";
import type { AssetInfo, BorrowerStatusEntity } from "granite-liq-bot-common";
import type { PriceFeedResponse } from "../../client/pyth";
import type { LiquidationBatch } from "../../types";
import { liquidationBatchCv, makeLiquidationBatch, priceFeedCv } from "./lib";

describe("liquidate lib", () => {
    test("priceFeedCv", () => {

        const priceFeed: PriceFeedResponse = {
            "attestation": "504e41550100000003b801000000040d003adfdfaa94472579a541ba3dbb0c94f877006a666d904d96d23bce0a442ec0d862ad22ce8e9048d733320701e45b98c8f6165bc9ce2aaf6cedee7b88f626eacc00034ac65958a6892a927dc5e6c19f739fb081c12609d105593de3a66f0ffedd7852689e16f336715248403c2259f9439abcb6c876ada670df9ceaf9664379fc72ef000412b26aef9e2d9a32828de2b8d1f621beed5039ed1e23d7ca9daa4ed36e04e6a5243f44b890646e4f8111526909689745d1790375a131598df6c3d9f10f5d0b9a00064b895756e6b8714f294cc66a4373233fc4fcb87b5c6e91cd30727c5d769035ce03e5908618635556877d4b0ad69cc8978a733d2f77495afbc0e1e91e3fc3cce701083d33253d414d463d1ac4ad24f5efd2f43ec30921df7440d9fc1671b166dda6ec519307b2de088f50b85f6e8f6b0024de374b3848374f9a0e6f2c5bc9f2c32a51000ac2a21503d333ba1a38009df79a624bbe4687c8dd5ef599c40d0bed516969f9a546f9cfd24fb00b169b2cace77e476ed13ad764a596927c9030cc1e34b0efeb97010b27850985067190df440c1796a30c5cb5b1ba4c1b3c8bbd7794a01dd5cfd48639680b1c5209f6e3d501a39c1617533b940e74c12ace60a1dbd95ae6e26abd828b010c27e8ed4b6764d68d74ae950245e453ed26cfca238cf776aab0fcf6af518ea384605b7fe86c78bad02093f1abebcc460952e7bda73681073e92d514eb86ff2682010d8d831c83e6bed34a00ed9734fdcf2cf050a3d8675c9063f74164a5d0ea89ac194f7c1afd5689555c40e7ffa9aed0c840aca020cbdeb941a53febc1e1560c8c66010eb5977d6578eefc6f1435ff7a8801f08fc96eec12c9227695dd8c256f2df0244e23eb8d77a1b685b2023dcaa6eb63c169947aeabf487743b72abb4c2fa8d616b3010f6f7b1b3321e95e0b5914007420b4f8f9333ea38e047ede3ff2aed0ccca6123e23a8c6b385438dbb168de476cb9648f20ed7dcb6e0d873d7f8423bf42c59bfa380110e42ba5972a75b778fa29a3467a439f7c30e122ac3831182bce054f86ba1056171af97ab6b96a8de3fb23dd8da63403530bab75bd2995b7e00925c478b210458b0111aca40f50eee2663ce2036d9c15395e75482751904b7698067e692426c0baa4b51ca9bee16b74467a599b3aae5cab8c1e9b75f225a313e21c9377868a1e00d89b0167a5e36900000000001ae101faedac5851e32b9b23b5f9411a8c2bac4aae3ed4dd7b811dd1a72ea4aa710000000006a904b0014155575600000000000bb5ecb500002710c036c2be99b80fdb01b060ceaf8c20c635a76b9c03005500e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43000008de357b5d81000000011a0127f2fffffff80000000067a5e3690000000067a5e369000008d99ec1658000000001076a8e180bd554e7030626969acf2025a321962a880b5dec7588685219eadc1019af3f073385c49bb23625cbec610b3d07c05b685d630fe8c267054f978089def5f761e9e5b7d56d5ffd5e8b211e85404d3b0d64c24b7ed9a19d1bec68f4b4362bae08ab166fbd9e07ba2c05eabe01a6b3e87f2a72549b32da3b48d14753e57b9600243ece5d8c58f129dde490abda4918bf2fa4a0b40069530b33baedd09b231690804eff3927f46b4b62cf46ff2fea2e9c58b50c04181bdde478f4acf7a05f4ee3881639fb7108f6558fdb29ed6d668a9f02214dc1ca4ad98efab0db3da721fc005500ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace00000040001ff0000000000007a12000fffffff80000000067a5e3690000000067a5e3690000003fc2ab35e0000000000850eb0f0bd05ed9eb4086cebc028b18950729a595caa000fbd42b22014807081f2f3d3205a6049ab4685a44d30a22d6e4fdffdc7d79372a1f0f0e729603ca3db41d01113f7202ca1b4337983e92561052039bd3eafad4d9c46a782de6354805e1bf334ed5be8704e014bede31beecc6bf807c6f790c1d04a7a5fa1565642532abad4e194375d2a45876a1ac256295d3b1bf2fa4a0b40069530b33baedd09b231690804eff3927f46b4b62cf46ff2fea2e9c58b50c04181bdde478f4acf7a05f4ee3881639fb7108f6558fdb29ed6d668a9f02214dc1ca4ad98efab0db3da721fc005500eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a0000000005f5dd41000000000001b301fffffff80000000067a5e3690000000067a5e3690000000005f5d2b8000000000001aeef0ba11f19eb79b163289f46fe7970708dc1005066fe23904274ef07b5d66ed94c47e38796c60a04b2d15ff4497130d00eb8785d7c806a42c2701593e98153bbfe77024f3335df67fc8963181e6bfcded09c4b7ed9a19d1bec68f4b4362bae08ab166fbd9e07ba2c05eabe01a6b3e87f2a72549b32da3b48d14753e57b9600243ece5d8c58f129dde490abda4918bf2fa4a0b40069530b33baedd09b231690804eff3927f46b4b62cf46ff2fea2e9c58b50c04181bdde478f4acf7a05f4ee3881639fb7108f6558fdb29ed6d668a9f02214dc1ca4ad98efab0db3da721fc",
            "items": {
                "btc": {
                    "id": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
                    "price": {
                        "price": "9750473039233",
                        "conf": "4731250674",
                        "expo": -8,
                        "publish_time": 1738924905
                    },
                    "ema_price": {
                        "price": "9730764400000",
                        "conf": "4419391000",
                        "expo": -8,
                        "publish_time": 1738924905
                    },
                    "metadata": {
                        "slot": 196471989,
                        "proof_available_time": 1738924906,
                        "prev_publish_time": 1738924905
                    }
                },
                "eth": {
                    "id": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
                    "price": {
                        "price": "274880000000",
                        "conf": "128000000",
                        "expo": -8,
                        "publish_time": 1738924905
                    },
                    "ema_price": {
                        "price": "273848940000",
                        "conf": "139520783",
                        "expo": -8,
                        "publish_time": 1738924905
                    },
                    "metadata": {
                        "slot": 196471989,
                        "proof_available_time": 1738924906,
                        "prev_publish_time": 1738924905
                    }
                },
                "usdc": {
                    "id": "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
                    "price": {
                        "price": "99999041",
                        "conf": "111361",
                        "expo": -8,
                        "publish_time": 1738924905
                    },
                    "ema_price": {
                        "price": "99996344",
                        "conf": "110319",
                        "expo": -8,
                        "publish_time": 1738924905
                    },
                    "metadata": {
                        "slot": 196471989,
                        "proof_available_time": 1738924906,
                        "prev_publish_time": 1738924905
                    }
                }
            }
        }

        expect(cvToJSON(priceFeedCv(priceFeed))).toEqual({
            "type": "(optional (buff 737))",
            "value": {
                "type": "(buff 737)",
                "value": "0x0b000000030c0000000804636f6e66010000000000000000000000011a0127f208656d612d636f6e6601000000000000000000000001076a8e1809656d612d7072696365000000000000000000000008d99ec16580046578706f00fffffffffffffffffffffffffffffff811707265762d7075626c6973682d74696d650100000000000000000000000067a5e369057072696365000000000000000000000008de357b5d811070726963652d6964656e7469666965720200000020e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b430c7075626c6973682d74696d650100000000000000000000000067a5e3690c0000000804636f6e660100000000000000000000000007a1200008656d612d636f6e66010000000000000000000000000850eb0f09656d612d70726963650000000000000000000000003fc2ab35e0046578706f00fffffffffffffffffffffffffffffff811707265762d7075626c6973682d74696d650100000000000000000000000067a5e36905707269636500000000000000000000000040001ff0001070726963652d6964656e7469666965720200000020ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace0c7075626c6973682d74696d650100000000000000000000000067a5e3690c0000000804636f6e66010000000000000000000000000001b30108656d612d636f6e66010000000000000000000000000001aeef09656d612d70726963650000000000000000000000000005f5d2b8046578706f00fffffffffffffffffffffffffffffff811707265762d7075626c6973682d74696d650100000000000000000000000067a5e3690570726963650000000000000000000000000005f5dd411070726963652d6964656e7469666965720200000020eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a0c7075626c6973682d74696d650100000000000000000000000067a5e369"
            }
        });
    });

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


    test("makeLiquidationBatch", () => {

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
                }
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
                }
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
                }
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

        let batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);

        expect(batch).toEqual([
            {
                user: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                liquidatorRepayAmount: 20000000000,
                minCollateralExpected: 204807,
            }
        ]);

        marketAsset = {
            "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc",
            "name": "mock-usdc",
            "symbol": "mock-usdc",
            "decimals": 8,
            "balance": 0
        };

        batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);
        expect(batch).toEqual([]);


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
                    "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": 5983.4133
                }
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
                }
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
                }
            }
        ]

        marketAsset = {
            "address": "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-usdc",
            "name": "mock-usdc",
            "symbol": "mock-usdc",
            "decimals": 8,
            "balance": 628000000000
        };

        batch = makeLiquidationBatch(marketAsset, collateralAsset, borrowers, priceFeed);

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