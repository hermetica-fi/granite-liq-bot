# Granite Liquidation Bot

To install dependencies:

```bash
bun install
```

To test:

```bash
bun test
```

Run with docker compose:

```bash
docker-compose up --build -d
```


## Environment variables

- `HIRO_API_KEY`: (optional) Hiro API key for stacks api
- `USE_STAGING`: (optional) 1 to use staging contracts on mainnet
- `DRY_RUN`: (optional) 1 to block liquidations
- `SKIP_PROFITABILITY_CHECK`: (optional) 1 to skip profitability check. Note that transactions might fail
- `SLACK_TOKEN`: Slack oauth token for alerts
- `SLACK_CHANNEL_ID`: Channel id to push slack alert messages

## API

See api [docs](src/api/API.md)