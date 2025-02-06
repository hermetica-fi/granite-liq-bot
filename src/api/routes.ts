import {
    cvToJSON, fetchCallReadOnlyFunction,
    getAddressFromPrivateKey
} from "@stacks/transactions";
import { generateWallet } from "@stacks/wallet-sdk";
import { getContractInfo } from "granite-liq-bot-common";
import { pool } from "../db";
import { getBorrowerStatusList, getContractList } from "../db-helper";
import { getNetworkNameFromAddress } from "../helper";

export const errorResponse = (error: any) => {
    if (typeof error === 'string') {
        return Response.json({ error: error }, { status: 400 });
    };

    const message = error instanceof Error ? error.message : 'Server error';
    return Response.json({ error: message }, { status: 400 });
}

export const routes = {
    getContracts: async (_: Request) => {
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

        let network;

        try {
            network = getNetworkNameFromAddress(address);
        } catch (error) {
            return errorResponse(error);
        }

        let dbClient = await pool.connect();
        if (await dbClient.query('SELECT * FROM contract WHERE network = $1', [network]).then(r => r.rows.length > 0)) {
            dbClient.release();
            return errorResponse(`A contract for ${network} already exists`);
        }
        dbClient.release();

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
        const borrowers = await getBorrowerStatusList(dbClient, {
            filters: {
                network: network
            },
            orderBy: 'max_repay_amount DESC, risk DESC'
        });
        dbClient.release();
        return Response.json(borrowers);
    }
}
