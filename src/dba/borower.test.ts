import { describe, expect, mock, setSystemTime, test } from "bun:test";
import { dbCon } from "../db/con";
import {
    clearBorrowerStatuses, getBorrowerCollateralAmount, getBorrowerStatusList, getBorrowersForHealthCheck,
    getBorrowersToSync, insertBorrowerStatus, switchBorrowerSyncFlagOff, syncBorrowerCollaterals,
    syncBorrowerPosition, upsertBorrower
} from "./borrower";


mock.module("../constants", () => {
    return {
        BORROWER_SYNC_DELAY: 10
    };
});

describe("dba borrower", () => {
    setSystemTime(1738262052565);
    test("upsertBorrower (insert)", () => {
        let resp = upsertBorrower('mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        expect(resp).toEqual(1);

        let resp2 = dbCon.query("SELECT * FROM borrower").all()
        expect(resp2).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                sync_flag: 1,
                sync_ts: 1738262062
            }
        ]);
    });

    test("upsertBorrower (nothing)", () => {
        const resp = upsertBorrower('mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        expect(resp).toEqual(0);
    });

    test("upsertBorrower (update)", () => {
        dbCon.run("UPDATE borrower set sync_flag=0 WHERE address=?", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']);
        const resp = upsertBorrower('mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        expect(resp).toEqual(2);
        const resp2 = dbCon.query("SELECT * FROM borrower").all();
        expect(resp2).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                sync_flag: 1,
                sync_ts: 1738262062
            }
        ])
    });

    test("getBorrowersToSync", () => {
        dbCon.run("DELETE FROM borrower");

        upsertBorrower('mainnet', 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        upsertBorrower('testnet', 'ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW');

        let resp = getBorrowersToSync();
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                syncTs: 1738262062,
            }, {
                address: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                network: "testnet",
                syncTs: 1738262062,
            }
        ]);
    });

    test("getBorrowersToSync (after update)", () => {
        switchBorrowerSyncFlagOff('SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR');
        const resp = getBorrowersToSync();
        expect(resp).toEqual([
            {
                address: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                network: "testnet",
                syncTs: 1738262062,
            }
        ]);
    });


    test("syncBorrowerPosition", () => {
        syncBorrowerPosition({ address: 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', network: 'mainnet', debtShares: 100, collaterals: ['SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc'] });
        const resp = dbCon.prepare("SELECT * FROM borrower_position WHERE address = $1", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']).all();
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                debt_shares: 100,
                collaterals: '["SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth","SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc"]',
            }
        ]);
    });

    test("syncBorrowerCollaterals", () => {
        syncBorrowerCollaterals('SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [
            { collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', amount: 100, network: 'mainnet' },
            { collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc', amount: 90, network: 'mainnet' }
        ]);
        const resp = dbCon.prepare("SELECT * FROM borrower_collaterals WHERE address = $1", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']).all();
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                collateral: "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc",
                amount: 90,
            },
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                collateral: "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth",
                amount: 100,
            }
        ]);
    });

    test("syncBorrowerCollaterals (update)", () => {
        syncBorrowerCollaterals('SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [{ collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc', amount: 60, network: 'mainnet' }]);
        const resp = dbCon.prepare("SELECT * FROM borrower_collaterals WHERE address = $1", ['SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR']).all();
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                collateral: "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc",
                amount: 60,
            }
        ]);
    });

    test("getBorrowersForHealthCheck", () => {
        syncBorrowerPosition({ address: 'SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', network: 'mainnet', debtShares: 15, collaterals: ['SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc'] });
        syncBorrowerPosition({ address: 'ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW', network: 'testnet', debtShares: 201, collaterals: ['ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW.mock-btc'] });

        const resp = getBorrowersForHealthCheck();

        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                debtShares: 15,
                collaterals: ["SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth", "SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-btc"],
            }, {
                address: "ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW",
                network: "testnet",
                debtShares: 201,
                collaterals: ["ST39B0S4TZP6H89VPBCCSCYXKX43DNNPNQV3BEWNW.mock-btc"],
            }
        ]);
    });


    test("getBorrowerCollateralAmount", () => {
        syncBorrowerCollaterals('SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', [{ network: 'mainnet', collateral: 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth', amount: 100 }]);
        const resp = getBorrowerCollateralAmount('SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', 'SP20M5GABDT6WYJHXBT5CDH4501V1Q65242SPRMXH.mock-eth');
        expect(resp).toEqual(100);
    });

    test("insertBorrowerStatus", () => {
        insertBorrowerStatus('SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR', 'mainnet', { ltv: 0.6977874992015272, health: 1.0206104956758972, debt: 526735.7296664099, collateral: 754865.5289313, risk: 0.9798057184761282, maxRepay: {}, totalRepayAmount: 0 });
        const resp = dbCon.query("SELECT * FROM borrower_status").all();
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                ltv: 0.6978,
                health: 1.0206,
                debt: 526735.7297,
                collateral: 754865.5289,
                risk: 0.9798,
                max_repay: '{}',
                total_repay_amount: 0
            }
        ])
    });

    test("getBorrowerStatusList", () => {
        const resp = getBorrowerStatusList({ filters: { network: 'mainnet' } });
        expect(resp).toEqual([
            {
                address: "SP70S68PQ3FZ5N8ERJVXQQXWBWNTSCMFZWWFZXNR",
                network: "mainnet",
                ltv: 0.6978,
                health: 1.0206,
                debt: 526735.7297,
                collateral: 754865.5289,
                risk: 0.9798,
                maxRepay: {},
                totalRepayAmount: 0,
            }
        ]);

        const resp2 = getBorrowerStatusList({ filters: { network: 'testnet' } });
        expect(resp2).toEqual([]);
    });

    test("clearBorrowerStatuses", () => {
        clearBorrowerStatuses();
        const resp = dbCon.query("SELECT * FROM borrower_status").all();
        expect(resp).toEqual([]);
    });
});
