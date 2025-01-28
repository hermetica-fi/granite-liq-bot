import { generateWallet } from "@stacks/wallet-sdk";
import { fetchCallReadOnlyFunction, getAddressFromPrivateKey } from "@stacks/transactions";
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

const addContract = async (req: Request) => {
    const body = await req.json();
    const { address, mnemonic } = body.contract;
    const networkName = getNetworkNameFromAddress(address);
    const network = networkFromName(networkName);
    const contractInfo = await getContractInfo(address, network);

    const wallet = await generateWallet({ secretKey: mnemonic, password: "", });
    const [account] = wallet.accounts;
    const ownerAddress = getAddressFromPrivateKey(account.stxPrivateKey, network);

    const owner = await fetchCallReadOnlyFunction({
        contractAddress: address.split('.')[0],
        contractName: address.split('.')[1],
        functionName: 'get-owner',
        functionArgs: [],
        senderAddress: ownerAddress,
        network,
    });

    return Response.json({

    });
}


export const main = async () => {
    const server = Bun.serve({
        port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 8081,
        async fetch(req) {
            const url = new URL(req.url);
            let res: Response;

            if (req.method === "GET" && url.pathname === "/get-contracts") {
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