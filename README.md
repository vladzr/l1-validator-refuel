# Validator Refuel

Service to regularly check and top up Avalanche L1 validator balances.

## Quickstart

- Clone repo, install Node.js 22 and `pnpm`
- install dependencies: `pnpm i`
- set all required environment variables found in `.env.example` (see also below)
- use `pnpm build` & `pnpm start` to build and run the service

If you only want to run the script _once_ on your local machine instead of using the periodic service, you can trigger the script by running `pnpm local`.

## Configuration

The following options are available to configure the service via _ENV_ variables:

### Required params

The following params need to be set for the service to work. The configured _faucet P-Chain address_ has to match the _faucet private key_. The address needs to be **funded** with AVAX tokens on the **P-Chain**.

```bash
CHAIN_ID=13337
FAUCET_PCHAIN_ADDRESS=P-fuji01234567890abcdef01234567890abcdef
FAUCET_PK=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### Optional overrides

For the following params, there are default values configured already, which can be overridden:

```bash
PORT=3000 # webserver port
CRON_SCHEDULE="0 4,16 * * *" # default: fires every 12 hours (4:00, 16:00)
RPC_PCHAIN=https://api.avax-test.network #  hostname only, must expose "/ext/bc/P/rpc" endpoint
UPTIME_API=https://testnet.nodes.onbeam.com/api/uptime # uptime api endpoint of delegation dashboard

BALANCE_THRESHOLD=0.1 # minimum validator P-chain balance in AVAX to trigger refuel
REFILL_AMOUNT=0.2 # amount of AVAX to refuel when triggered
UPTIME_THRESHOLD=80 # minimum validator uptime % to be considered for refuel

DELAY_PCHAIN_TX=10000 # timeout in ms after every P-Chain tx
DELAY_VALIDATOR=1000 # timeout in ms after processing a validator
BLACKLISTED_VALIDATOR_IDS=NodeID-123,NodeID-234 # comma-separated list of node IDs to ignore

FAUCET_BALANCE_ERROR=1 # throw error if balance is less than 1 AVAX
FAUCET_BALANCE_WARN=10 # log a warning if the faucet holds less then 10 AVAX
```
