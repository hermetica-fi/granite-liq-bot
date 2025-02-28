import { describe, expect, mock, setSystemTime, test } from "bun:test";
import { newDb } from "pg-mem";
import { migrateDb } from "../db/migrate";
import { getContractList, getContractOperatorPriv, insertContract } from "./contract";

const db = newDb();
const pg = db.adapters.createPg();
const pool = new pg.Pool();
const client = new pg.Client();

mock.module("../db/index", () => {
    return {
        pool
    };
});

await migrateDb();


describe("dba contracts", () => {
    test("insertContract", async () => {
        setSystemTime(1738262052565);
        await insertContract(client,
            'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator',
            'mainnet',
            'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T',
            '0x1.',
            { address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc", name: "Ethereum USDC via Allbridge", symbol: "aeUSDC", decimals: 6 },
            { address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token", name: "sBTC", symbol: "sBTC", decimals: 8 }
        );
    });

    test("insertContract", async () => {
        setSystemTime(1738262062565);
        await insertContract(client,
            'ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator',
            'testnet',
            'ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T',
            '0x2.',
            { address: "ST3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.mock-usdc", name: "mock USDC", symbol: "USDC", decimals: 8 },
            { address: "SN3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.mock-sbtc", name: "mock sBTC", symbol: "sBTC", decimals: 8 }
        );
    });

    test("insertContract network must be unique", async () => {
        expect(async () => {
            await insertContract(client,
                'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator',
                'mainnet', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T',
                '0x..',
                { address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc", name: "Ethereum USDC via Allbridge", symbol: "aeUSDC", decimals: 6 },
                { address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token", name: "sBTC", symbol: "sBTC", decimals: 8 }
            )
        }).toThrow();
    });


    test("getContractList", async () => {
        const contracts = await getContractList(client, { orderBy: 'created_at DESC' });
        expect(contracts).toEqual([
            {
                id: "ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
                address: "ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "liquidator",
                network: "testnet",
                operatorAddress: "ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                marketAsset: {
                    address: "ST3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.mock-usdc",
                    decimals: 8,
                    name: "mock USDC",
                    symbol: "USDC",
                    balance: 0,
                },
                collateralAsset: {
                    address: "SN3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.mock-sbtc",
                    decimals: 8,
                    name: "mock sBTC",
                    symbol: "sBTC",
                    balance: 0,
                },
                lockTx: null,
                unlocksAt: null,
            }, {
                id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "liquidator",
                network: "mainnet",
                operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                marketAsset: {
                    address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                    decimals: 6,
                    name: "Ethereum USDC via Allbridge",
                    symbol: "aeUSDC",
                    balance: 0,
                },
                collateralAsset: {
                    address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                    decimals: 8,
                    name: "sBTC",
                    symbol: "sBTC",
                    balance: 0,
                },
                lockTx: null,
                unlocksAt: null,
            }
        ])
    });

    test("getContractList with filters", async () => {
        const contracts = await getContractList(client, { filters: { network: 'mainnet' }, orderBy: 'created_at DESC' });
        expect(contracts).toEqual([
            {
                id: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
                address: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                name: "liquidator",
                network: "mainnet",
                operatorAddress: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T",
                marketAsset: {
                    address: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc",
                    decimals: 6,
                    name: "Ethereum USDC via Allbridge",
                    symbol: "aeUSDC",
                    balance: 0,
                },
                collateralAsset: {
                    address: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
                    decimals: 8,
                    name: "sBTC",
                    symbol: "sBTC",
                    balance: 0,
                },
                lockTx: null,
                unlocksAt: null,
            }
        ])
    });

    test("getContractOperatorPriv", async () => {
        const priv = await getContractOperatorPriv(client, "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        expect(priv).toEqual("0x1.");
    });

    test("getContractOperatorPriv", async () => {
        const priv = await getContractOperatorPriv(client, "ST1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator");
        expect(priv).toEqual("0x2.");
    }); 
});
