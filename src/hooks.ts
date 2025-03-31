import type { LiquidationBatch } from "./types"

export const onStart = async () => {
    
}

export const onLiqTx = async (txid: string, batch: LiquidationBatch[]) => {

}

export const onLiqProfitError = async (spend: number, receive: number, best: number) => {

}

export const onLiqTxError = async (reason: string) => {

}

export const onLiqTxEnd = async (txid: string, status: string) => {

}

