
## Objects

### AssetInfoWithBalance
```ts
{
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    balance: number,
}
```

### ContractEntity

```ts
{
    id: string,
    address: string,
    name: string,
    operatorAddress: string,
    operatorBalance: number,
    marketAsset: AssetInfoWithBalance | null,
    collateralAsset: AssetInfoWithBalance | null,
    lockTx: string | null
    unlocksAt: number | null,
}
```

### LiquidationEntity

```ts
{
    txid: string,
    contract: string,
    status: string,
    createdAt: number,
    updatedAt: number | null,
}
```


### BorrowerStatusEntity

```ts
{
    address: string
    ltv: number,
    health: number,
    debt: number,
    collateral: number,
    risk: number,
    maxRepay: Record<string, number>,
    totalRepayAmount: number,
}
```

### Health

```ts
{
    now: string, // current server date (ISO)
    lastSync: string, // last sync date (ISO)
    lastLiquidation: LiquidationEntity | null,
    balances: {
        operatorBalance: number | null,
        marketAssetBalance: number | null,
    },
    isHealthy: boolean
}
```

## Endpoints

### /contracts [GET] 

Returns [ContractEntity](#ContractEntity) list

### /add-contract [POST]

Content-Type: application/json

Post Params: 
- address: Full address of the contract (e.g: SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator)
- mnemonic: mnemonic of the operator (e.g: 'oval express iron distance ...')

Returns: [ContractEntity](#ContractEntity) list

Example: 
```bash
curl --header "Content-Type: application/json" \
--request POST \
--data '{"address":"SP1NNSAHT51JS8MEDDBYC7WYD2A2EGB0EMVD35KMA.liquidator","mnemonic":"oval express iron distance ..."}' \
http://localhost:8081/add-contract  
```

### /borrowers [GET]

Returns: [BorrowerStatusEntity](#BorrowerStatusEntity) list

### /health [GET]

Returns: [Health](#Health)

### /liquidations [GET]

SearchParams: 
- fromTimestamp: unix timestamp in seconds
- toTimestamp: unix timestamp in seconds

Returns: [LiquidationEntity](#LiquidationEntity) list
