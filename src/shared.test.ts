import { expect, setSystemTime, test } from "bun:test";
import { calcBorrowerStatus } from "./shared";
import type { MarketState } from "./types";

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
                decimals: 8,
                maxLTV: 70000000,
            },
            "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": {
                liquidationLTV: 51000000,
                decimals: 8,
                maxLTV: 50000000,
            },
        },
        priceFeed: {
            btc: 10524868578626,
            eth: 326603000000,
            usdc: 100005237,
        },
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

    expect(calcBorrowerStatus(borrower, marketState)).toEqual({
        health: 1.0206104956758972,
        debt: 526735.7296664099,
        collateral: 754865.5289313,
        risk: 0.9798057184761282,
        liquidateAmt: 0,
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
                decimals: 8,
                maxLTV: 70000000,
            },
            "ST20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth": {
                liquidationLTV: 51000000,
                decimals: 8,
                maxLTV: 50000000,
            },
        },
        priceFeed: {
            btc: 10549298752013,
            eth: 327439303121,
            usdc: 100003543,
        },
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

    expect(calcBorrowerStatus(borrower, marketState)).toEqual({
        health: 0.7310475216909251,
        debt: 15038.024870804698,
        collateral: 21555.903554761313,
        risk: 1.3679001300585538,
        liquidateAmt: 9466.829096497871,
      });
});
