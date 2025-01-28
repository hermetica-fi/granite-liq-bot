import { generateWallet } from "@stacks/wallet-sdk";
import { cvToJSON, fetchCallReadOnlyFunction, getAddressFromPrivateKey } from "@stacks/transactions";
import { getNetworkNameFromAddress } from "../helper";
import { getContractInfo } from "../hiro-api";
import { networkFromName } from "@stacks/network";
import { pool } from "../db";

const getContracts = async (req: Request) => {
    const dbClient = await pool.connect();
    const contracts = await dbClient.query('SELECT address, network, owner_address FROM contracts').then(r => r.rows);
    dbClient.release();
    return Response.json(contracts);
}

const errorResponse = (error: any) => {
    if (typeof error === 'string') {
        return Response.json({ error: error }, { status: 400 });
    };

    const message = error instanceof Error ? error.message : 'Server error';
    return Response.json({ error: message }, { status: 400 });
}

const addContract = async (req: Request) => {
    const body = await req.json();
    const { address, mnemonic } = body;

    if (address.trim() === '') {
        return errorResponse('Enter an address');
    }

    if (mnemonic.trim() === '') {
        return errorResponse('Enter a mnemonic');
    }

    let dbClient = await pool.connect();
    if (await dbClient.query('SELECT * FROM contracts WHERE address = $1', [address]).then(r => r.rows.length > 0)) {
        dbClient.release();
        return errorResponse('Contract already exists');
    }
    dbClient.release();

    let networkName;

    try {
        networkName = getNetworkNameFromAddress(address);
    } catch (error) {
        return errorResponse(error);
    }

    const network = networkFromName(networkName);

    let wallet;
    try {
        wallet = await generateWallet({ secretKey: mnemonic, password: "", });
    } catch (error) {
        return errorResponse(error);
    }

    const [owner] = wallet.accounts;
    const ownerAddress = getAddressFromPrivateKey(owner.stxPrivateKey, network);

    let contractInfo;
    try {
        contractInfo = await getContractInfo(address, network);
    } catch (error) {
        return errorResponse('Could not fetch contract info');
    }

    if (contractInfo.error && contractInfo.message) {
        return errorResponse(contractInfo.message);
    }

    let onChainOwnerAddress;
    try {
        onChainOwnerAddress = await fetchCallReadOnlyFunction({
            contractAddress: address.split('.')[0],
            contractName: address.split('.')[1],
            functionName: 'get-owner',
            functionArgs: [],
            senderAddress: ownerAddress,
            network,
        }).then(r => cvToJSON(r).value);
    } catch (error) {
        return errorResponse('Could not fetch contract owner');
    }

    console.log(onChainOwnerAddress, ownerAddress)

    if (onChainOwnerAddress !== ownerAddress) {
        return errorResponse('Contract owner does not match');
    }

    dbClient = await pool.connect();
    await dbClient.query('INSERT INTO contracts (address, network, owner_address, owner_priv) VALUES ($1, $2, $3, $4)', [address, networkName, ownerAddress, owner.stxPrivateKey]);
    const contracts = await dbClient.query('SELECT address, network, owner_address FROM contracts').then(r => r.rows);
    dbClient.release();
    
    return Response.json(contracts);
}


export const main = async () => {
    const server = Bun.serve({
        port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 8081,
        async fetch(req) {
            const url = new URL(req.url);
            let res: Response;

            if (req.method === "GET" && url.pathname === "/contracts") {
                res = await getContracts(req);
            } else if (req.method === "POST" && url.pathname === "/add-contract") {
                res = await addContract(req);
            } else {
                res = new Response("Not found", { status: 404 });
            }

            res.headers.set('Access-Control-Allow-Origin', '*');
            res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

            return res;
        },
    });

    console.log(`Server running on http://${server.hostname}:${server.port}`);

}