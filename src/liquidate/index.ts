import { parseUnits } from "granite-liq-bot-common";
import type { PoolClient } from "pg";
import { pythFetchgGetPriceFeed } from "../../common/pyth";
import { PRICE_FEED_IDS } from "../constants";
import { pool } from "../db";
import { createLogger } from "../logger";
const logger = createLogger("liquidate");

const worker = async (dbClient: PoolClient) => {
    const borrowers = await dbClient.query("SELECT address, network, max_repay_amount FROM borrower_status WHERE max_repay_amount>0 ORDER BY max_repay_amount DESC").then(r => r.rows);
    console.log(borrowers)
    for (const borrower of borrowers) {
       
        const contract = await dbClient.query("SELECT address, name, operator_address, network, market_asset, market_asset_balance, collateral_asset FROM contract WHERE network = $1 LIMIT 1", [borrower.network]).then(r => r.rows[0]);
        if (!contract) {
            logger.info(`Contract not found for ${borrower.network}`);
            continue;
        }

        if (!contract.market_asset) {
            logger.info(`Market asset not found for contract ${contract.address} on ${contract.network}`);
            continue;
        }

        if (!contract.market_asset.balance) {
            logger.info(`Market asset balance is 0 for contract ${contract.address} on ${contract.network}`);
            continue;
        }

        if (!contract.collateral_asset) {
            logger.info(`Collateral asset not found for contract ${contract.address} on ${contract.network}`);
            continue;
        }


        // Adjust down max repay amount %0,05 to prevent transaction failure in case high volatility
        const repayAmountAdjusted = borrower.max_repay_amount * 0.95;

        const repayAmountAdjustedBn = parseUnits(repayAmountAdjusted, contract.market_asset.decimals);
        const repayAmountFinalBn = Math.min(contract.market_asset_balance, repayAmountAdjustedBn);

        const priceFeedKey = Object.keys(PRICE_FEED_IDS).find(key => contract.market_asset.symbol.toLowerCase().indexOf(key.toLowerCase()) !== -1);
        if (!priceFeedKey) {
            logger.error(`Price feed key not exists for ${contract.market_asset.symbol}`);
            continue;
        }

        const priceFeed = await pythFetchgGetPriceFeed(PRICE_FEED_IDS[priceFeedKey as "btc" | "eth" | "usdc"]);


        console.log( borrower.max_repay_amount)




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