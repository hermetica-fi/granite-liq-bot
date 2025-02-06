import { expect, setSystemTime, test } from "bun:test";
import type { MarketState } from "../../types";
import { calcBorrowerStatus } from "./shared";

const priceFeed = {
    "attestation": "0",
    "items": {
      "btc": {
        "id": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
        "price": {
          "price": "9641980806249",
          "conf": "4069193751",
          "expo": -8,
          "publish_time": 1738867653
        },
        "ema_price": {
          "price": "9661765600000",
          "conf": "4777017400",
          "expo": -8,
          "publish_time": 1738867653
        },
        "metadata": {
          "slot": 196328588,
          "proof_available_time": 1738867654,
          "prev_publish_time": 1738867652
        }
      },
      "eth": {
        "id": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
        "price": {
          "price": "269889923204",
          "conf": "131951019",
          "expo": -8,
          "publish_time": 1738867653
        },
        "ema_price": {
          "price": "270519220000",
          "conf": "160691626",
          "expo": -8,
          "publish_time": 1738867653
        },
        "metadata": {
          "slot": 196328588,
          "proof_available_time": 1738867654,
          "prev_publish_time": 1738867652
        }
      },
      "usdc": {
        "id": "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
        "price": {
          "price": "99997731",
          "conf": "104164",
          "expo": -8,
          "publish_time": 1738867653
        },
        "ema_price": {
          "price": "99997983",
          "conf": "112524",
          "expo": -8,
          "publish_time": 1738867653
        },
        "metadata": {
          "slot": 196328588,
          "proof_available_time": 1738867654,
          "prev_publish_time": 1738867652
        }
      }
    }
  }

test("calcBorrowerStatus 1", () => {
    setSystemTime(1738262052565);
    const marketState: MarketState = {
        irParams: {
            baseIR: 3000000000000,
            slope1: 130000000000,
            slope2: 2000000000000,
            urKink: 700000000000,
        },
        lpParams: {
            totalAssets: 1248927534554720,
            totalShares: 1249258900378186,
        },
        accrueInterestParams: {
            lastAccruedBlockTime: 1738245754,
        },
        debtParams: {
            openInterest: 117785897824021,
            totalDebtShares: 96783307587268,
        },
        collateralParams: {
            "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": {
                liquidationLTV: 80000000,
                maxLTV: 70000000,
            },
            "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": {
                liquidationLTV: 51000000,
                maxLTV: 50000000,
            },
        },
        /*
        priceFeed: {
            btc: 10524868578626,
            eth: 326603000000,
            usdc: 100005237,
        },
        */
        marketAssetParams: {
            decimals: 8
        }
    };

    const borrower = {
        debtShares: 43213934616323,
        collateralsDeposited: {
            'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': 7000000000,
            'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc': 500000000
        }
    }

    expect(calcBorrowerStatus(borrower, marketState, priceFeed)).toEqual({
        ltv: 0.6977874992015272,
        health: 1.0206104956758972,
        debt: 526735.7296664099,
        collateral: 754865.5289313,
        risk: 0.9798057184761282,
        maxRepayAmount: 0
    });
});


test("calcBorrowerStatus 2", () => {
    setSystemTime(1738262557287);
    const marketState: MarketState = {
        irParams: {
            baseIR: 3000000000000,
            slope1: 130000000000,
            slope2: 2000000000000,
            urKink: 700000000000,
        },
        lpParams: {
            totalAssets: 1248927534554720,
            totalShares: 1249258900378186,
        },
        accrueInterestParams: {
            lastAccruedBlockTime: 1738245754,
        },
        debtParams: {
            openInterest: 117785897824021,
            totalDebtShares: 96783307587268,
        },
        collateralParams: {
            "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc": {
                liquidationLTV: 80000000,
                maxLTV: 70000000,
            },
            "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": {
                liquidationLTV: 51000000,
                maxLTV: 50000000,
            },
        },
        /*
        priceFeed: {
            btc: 10549298752013,
            eth: 327439303121,
            usdc: 100003543,
        },
        */
        marketAssetParams: {
            decimals: 8
        }
    }

    const borrower = {
        debtShares: 1233675334672,
        collateralsDeposited: {
            'ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth': 658317537
        }
    }

    expect(calcBorrowerStatus(borrower, marketState, priceFeed)).toEqual({
        ltv: 0.6976290663298624,
        health: 0.7310475216909251,
        debt: 15038.024870804698,
        collateral: 21555.903554761313,
        risk: 1.3679001300585538,
        maxRepayAmount: 15038.080185625755
    });
});
