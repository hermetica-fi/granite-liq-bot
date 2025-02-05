import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { fetchFn, parseUnits } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { pythFetchgGetPriceFeed } from "../../common/pyth";
import { PRICE_FEED_IDS } from "../constants";
import { pool } from "../db";
import { createLogger } from "../logger";
const logger = createLogger("liquidate");

const worker = async (dbClient: PoolClient) => {
    const borrowers = await dbClient.query("SELECT address, network, max_repay_amount FROM borrower_status WHERE max_repay_amount>0 ORDER BY max_repay_amount DESC").then(r => r.rows);
    //console.log(borrowers)
    for (const borrower of borrowers) {
        // logger.info(`${borrower.address} on ${borrower.network} able to liquidate ${borrower.max_repay_amount} debt`);

        // Adjust down max repay amount %0,05 to prevent transaction failure in case high volatility
        const repayAmountAdjusted = borrower.max_repay_amount * 0.95;

        const contract = await dbClient.query("SELECT address, name, operator_address, network FROM contract WHERE network = $1 LIMIT 1", [borrower.network]).then(r => r.rows[0]);
        if (!contract) {
            logger.info(`Contract not found for ${borrower.network}`);
            continue;
        }

        const contractInfo = await fetchCallReadOnlyFunction({
            contractAddress: contract.address,
            contractName: contract.name,
            functionName: 'get-info',
            functionArgs: [],
            senderAddress: contract.operator_address,
            network: contract.network,
            client: {
                fetch: fetchFn,
            }
        }).then(r => cvToJSON(r).value[0]?.value);

        if (!marketAsset) {
            logger.info(`Market asset not found for contract ${contract.address} on ${contract.network}`);
            continue;
        }




        const marketAssetBalance = await fetchCallReadOnlyFunction({
            contractAddress: marketAsset.split(".")[0],
            contractName: marketAsset.split(".")[1],
            functionName: 'get-balance',
            functionArgs: [
                contractPrincipalCV(contract.address, contract.name)
            ],
            senderAddress: contract.operator_address,
            network: contract.network,
            client: {
                fetch: fetchFn,
            }
        }).then(r => Number(cvToJSON(r).value.value));

        const marketAssetDecimals = await fetchCallReadOnlyFunction({
            contractAddress: marketAsset.split(".")[0],
            contractName: marketAsset.split(".")[1],
            functionName: 'get-decimals',
            functionArgs: [],
            senderAddress: contract.operator_address,
            network: contract.network,
            client: {
                fetch: fetchFn,
            }
        }).then(r => cvToJSON(r).value.value);

        const marketAssetSymbol = await fetchCallReadOnlyFunction({
            contractAddress: marketAsset.split(".")[0],
            contractName: marketAsset.split(".")[1],
            functionName: 'get-symbol',
            functionArgs: [

            ],
            senderAddress: contract.operator_address,
            network: contract.network,
            client: {
                fetch: fetchFn,
            }
        }).then(r => cvToJSON(r).value.value);

        const repayAmountAdjustedBn = parseUnits(repayAmountAdjusted, marketAssetDecimals);
        const repayAmountFinalBn = Math.min(marketAssetBalance, repayAmountAdjustedBn);


        const priceFeedKey = Object.keys(PRICE_FEED_IDS).find(key => marketAssetSymbol.toLowerCase().indexOf(key.toLowerCase()) !== -1);
        if (!priceFeedKey) {
            logger.error(`Price feed key not exists for ${marketAssetSymbol}`);
            continue;
        }

        const priceFeed = await pythFetchgGetPriceFeed(PRICE_FEED_IDS[priceFeedKey as "btc" | "eth" | "usdc"]);

        console.log(priceFeed)



        // make sure no transaction is broadcasted for this borrower
        // get contract's market asset balance
        // determine repay amount using max_repay_amount and the contract's market asset balance
        // broadcast transaction

        // logger.info(`Borrower ${borrower.address} on ${borrower.network} has ${borrower.max_repay_amount} max repay amount`);
    }
}

export const main = async () => {
    let dbClient = await pool.connect();
    await worker(dbClient)
    dbClient.release();
}

main()