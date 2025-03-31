import { WebClient } from "@slack/web-api";
import { createLogger } from "./logger";
import type { LiquidationBatch } from "./types";

const logger = createLogger("hooks");

const SLACK_TOKEN = process.env.SLACK_TOKEN?.trim();
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID?.trim();

const slackClient = SLACK_TOKEN && SLACK_CHANNEL_ID ? new WebClient(process.env.SLACK_TOKEN, {}) : null;

const slackMessage = async (message: string) => {
    if (slackClient) {
        try {
            await slackClient.chat.postMessage({
                text: message,
                channel: SLACK_CHANNEL_ID!,
            });
        } catch (e) {
            logger.error(`Could not post slack message due to: ${e}`);
        }
    }
}

export const onStart = async () => {
    await slackMessage('Liq-bot started');
}

export const onLiqTx = async (txid: string, totalSpend: number, totalReceive: number, batch: LiquidationBatch[]) => {
    await slackMessage(`New liquidation: ${txid} totalSpend: ${totalSpend} totalReceive: ${totalReceive} batch: ${JSON.stringify(batch, null, 2)}`);
}

export const onLiqProfitError = async (spend: number, receive: number, best: number) => {
    await slackMessage(`Not profitable to liquidate. total spend: ${spend}, total receive: ${receive}, best swap: ${best}`);
}

export const onLiqTxError = async (reason: string) => {
    await slackMessage(`Transaction failed due to: ${reason}`);
}

export const onLiqTxEnd = async (txid: string, status: string) => {
    await slackMessage(`Liquidation tx ${txid} finalized with status ${status}`);
}
