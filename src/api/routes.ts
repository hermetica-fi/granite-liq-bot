import {
    broadcastTransaction, contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction, fetchFeeEstimateTransaction,
    getAddressFromPrivateKey, listCV, makeContractCall, serializePayload, uintCV, type ClarityValue
} from "@stacks/transactions";
import { generateWallet } from "@stacks/wallet-sdk";
import { fetchFn, getAccountNonces, getContractInfo, TESTNET_FEE, type BorrowerStatus, type ContractEntity } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { MAINNET_MAX_FEE } from "../constants";
import { pool } from "../db";
import { getNetworkNameFromAddress } from "../helper";

export const errorResponse = (error: any) => {
    if (typeof error === 'string') {
        return Response.json({ error: error }, { status: 400 });
    };

    const message = error instanceof Error ? error.message : 'Server error';
    return Response.json({ error: message }, { status: 400 });
}

const getContractList = async (dbClient: PoolClient): Promise<ContractEntity[]> => {
    return dbClient.query('SELECT id, address, name, network, operator_address, market_asset, collateral_asset FROM contract ORDER BY created_at DESC')
        .then(r => r.rows).then(rows => rows.map(row => ({
            id: row.id,
            address: row.address,
            name: row.name,
            network: row.network,
            operatorAddress: row.operator_address,
            marketAsset: row.market_asset ? {
                ...row.market_asset,
                balance: row.market_asset_balance
            }: null,
            collateralAsset: row.collateral_asset ? {
                ...row.collateral_asset,
                balance: row.collateral_asset_balance
            }: null,
        })));
}

export const routes = {
    getContracts: async (req: Request) => {
        const dbClient = await pool.connect();
        const contracts = await getContractList(dbClient);
        dbClient.release();
        return Response.json(contracts);
    },
    addContract: async (req: Request) => {
        const body = await req.json();
        const address = body.address?.trim();
        const mnemonic = body.mnemonic?.trim();

        if (address === '') {
            return errorResponse('Enter an address');
        }

        if (mnemonic === '') {
            return errorResponse('Enter a mnemonic');
        }

        let dbClient = await pool.connect();
        if (await dbClient.query('SELECT * FROM contract WHERE address = $1', [address]).then(r => r.rows.length > 0)) {
            dbClient.release();
            return errorResponse('Contract already exists');
        }
        dbClient.release();

        let network;

        try {
            network = getNetworkNameFromAddress(address);
        } catch (error) {
            return errorResponse(error);
        }

        let wallet;
        try {
            wallet = await generateWallet({ secretKey: mnemonic, password: "", });
        } catch (error) {
            return errorResponse(error);
        }

        const [operator] = wallet.accounts;
        const operatorAddress = getAddressFromPrivateKey(operator.stxPrivateKey, network);

        let contractInfo;
        try {
            contractInfo = await getContractInfo(address, network);
        } catch (error) {
            return errorResponse('Could not fetch contract info');
        }

        if (contractInfo.error && contractInfo.message) {
            return errorResponse(contractInfo.message);
        }

        let onChainOperatorAddress;
        const [contractAddress, contractName] = address.trim().split('.');
        try {
            onChainOperatorAddress = await fetchCallReadOnlyFunction({
                contractAddress,
                contractName,
                functionName: 'get-operator',
                functionArgs: [],
                senderAddress: operatorAddress,
                network: network,
            }).then(r => cvToJSON(r).value);
        } catch (error) {
            return errorResponse('Could not fetch contract operator');
        }

        if (onChainOperatorAddress !== operatorAddress) {
            return errorResponse('Contract operator does not match');
        }

        dbClient = await pool.connect();
        await dbClient.query('INSERT INTO contract (id, address, name, network, operator_address, operator_priv) VALUES ($1, $2, $3, $4, $5, $6)',
            [address, contractAddress, contractName, network, operatorAddress, operator.stxPrivateKey]);
        const contracts = await getContractList(dbClient);
        dbClient.release();
        return Response.json(contracts);

    },
    getBorrowers: async (req: Request, url: URL) => {
        const network = url.searchParams.get('network') || 'mainnet';
        const dbClient = await pool.connect();
        const borrowers: BorrowerStatus[] = await dbClient.query('SELECT * FROM borrower_status WHERE network = $1 ORDER BY max_repay_amount DESC, risk DESC', [network])
            .then(r => r.rows).then(rows => rows.map(row => ({
                address: row.address,
                network: row.network,
                ltv: Number(row.ltv),
                health: Number(row.health),
                debt: Number(row.debt),
                collateral: Number(row.collateral),
                risk: Number(row.risk),
                maxRepayAmount: Number(row.max_repay_amount),
            })));
        dbClient.release();
        return Response.json(borrowers);
    },
    setContractValue: async (req: Request) => {
        const body = await req.json();
        const contractId = body.contractId?.trim();
        const fn = body.fn;
        const value = body.value?.trim();

        if (contractId === '') {
            return errorResponse('Invalid contract id');
        }

        if (['set-market-assets', 'set-collateral-assets', 'set-unprofitability-threshold'].indexOf(fn) === -1) {
            return errorResponse('Invalid key');
        }

        if (contractId === '') {
            return errorResponse('Invalid contract id');
        }

        const dbClient = await pool.connect();
        const contract = await dbClient.query('SELECT address, name, operator_priv, network FROM contract WHERE id = $1 LIMIT 1', [contractId]).then(r => r.rows[0]);
        dbClient.release();

        if (!contract) {
            return errorResponse('Contract not found');
        }

        const { operator_priv: priv, network } = contract;

        const operatorAddress = getAddressFromPrivateKey(priv, network);

        if (['set-market-assets', 'set-collateral-assets'].includes(fn) && value) {
            let assetContractInfo;
            try {
                assetContractInfo = await getContractInfo(value, network);
            } catch (error) {
                return errorResponse('Could not fetch contract info');
            }

            if (assetContractInfo.error && assetContractInfo.message) {
                return errorResponse(assetContractInfo.message);
            }
        }

        let onChainOperatorAddress;
        try {
            onChainOperatorAddress = await fetchCallReadOnlyFunction({
                contractAddress: contract.address,
                contractName: contract.name,
                functionName: 'get-operator',
                functionArgs: [],
                senderAddress: operatorAddress,
                network: network,
            }).then(r => cvToJSON(r).value);
        } catch (error) {
            return errorResponse('Could not fetch contract operator');
        }

        if (onChainOperatorAddress !== operatorAddress) {
            return errorResponse('Contract operator does not match');
        }

        let nonce;
        try {
            nonce = (await getAccountNonces(operatorAddress, network)).possible_next_nonce;
        } catch (error) {
            return errorResponse('Could not get nonce');
        }

        let functionArgs: ClarityValue[] = [];
        if (['set-market-assets', 'set-collateral-assets'].includes(fn) ) {
            if (value) {
                functionArgs = [listCV([contractPrincipalCV(value.split('.')[0], value.split('.')[1])])]
            } else {
                functionArgs = [listCV([])];
            }
        } else if (fn === 'set-unprofitability-threshold') {
            functionArgs = [uintCV(value || 0)];
        }

        const txOptions = {
            contractAddress: contract.address,
            contractName: contract.name,
            functionName: fn,
            functionArgs,
            senderKey: priv,
            senderAddress: operatorAddress,
            network: network,
            fee: TESTNET_FEE,
            validateWithAbi: true,
            nonce
        }

        let transaction;
        try {
            transaction = await makeContractCall(txOptions);
        } catch (e) {
            return errorResponse('Could not make contract call');
        }

        if (network === 'mainnet') {
            let feeEstimate;

            try {
                feeEstimate = await fetchFeeEstimateTransaction({ payload: serializePayload(transaction.payload), network, client: { fetch: fetchFn } });
            } catch (e) {
                return errorResponse('Could not get fee estimate');
            }

            const fee = feeEstimate[1].fee;
            transaction.setFee(fee > MAINNET_MAX_FEE ? MAINNET_MAX_FEE : fee);
        }

        let result;

        try {
            result = await broadcastTransaction({ transaction, network, client: { fetch: fetchFn } });
        } catch (e) {
            return errorResponse('Could not broadcast transaction');
        }

        return Response.json({ txid: result.txid });
    }
}
