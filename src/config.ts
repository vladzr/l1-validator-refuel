import { pvm, utils, secp256k1 } from '@avalabs/avalanchejs';
import dotenv from 'dotenv';
import type { ChainConfig } from './types';

dotenv.config();

let blacklistedValidatorIds: string[] = [];
if (process.env.BLACKLISTED_VALIDATOR_IDS) {
  blacklistedValidatorIds = process.env.BLACKLISTED_VALIDATOR_IDS.split(
    ',',
  ).map((id: string) => id.trim());
}

const beamMainnet: ChainConfig = {
  pChainRpcHost: process.env.RPC_PCHAIN || 'https://api.avax.network',
  pChainTxDelay: Number(process.env.DELAY_PCHAIN_TX) || 10000,

  validatorBalanceThreshold: Number(process.env.BALANCE_THRESHOLD) || 0.1,
  validatorBalanceTopUp: Number(process.env.REFILL_AMOUNT) || 0.2,
  validatorDelay: Number(process.env.DELAY_VALIDATOR) || 1000,
  validatorUptimeThresholdPercent: Number(process.env.UPTIME_THRESHOLD) || 80,
  useValidatorUptimeFilter:
    process.env.USE_UPTIME_FILTER?.toLowerCase() !== 'false',
  blacklistedValidatorIds,

  faucetBalanceThresholdWarn: Number(process.env.FAUCET_BALANCE_WARN) || 10,
  faucetBalanceThresholdError: Number(process.env.FAUCET_BALANCE_ERROR) || 1,

  evmChainRpcHost: process.env.RPC_EVM,
  blockchainId: '2tmrrBo1Lgt1mzzvPSFt73kkQKFas5d1AP88tv9cicwoFp8BSn',
};

const beamTestnet: ChainConfig = {
  ...beamMainnet,
  testnet: true,
  pChainRpcHost: process.env.RPC_PCHAIN || 'https://api.avax-test.network',

  evmChainRpcHost: process.env.RPC_EVM || 'https://api.avax.network',
  blockchainId: 'y97omoP2cSyEVfdSztQHXD9EnfnVP9YKjZwAxhUfGbLAPYT9t',
};

export const CHAINS: Record<string, ChainConfig> = {
  '4337': beamMainnet,
  '13337': beamTestnet,
};

export const getConfig = () => {
  const chainId = process.env.CHAIN_ID;
  const faucetPChainAddress = process.env.FAUCET_PCHAIN_ADDRESS;
  const faucetPK = process.env.FAUCET_PK;

  // env checks
  if (!chainId) {
    throw new Error('env CHAIN_ID is not set');
  }
  if (!faucetPK) {
    throw new Error('env FAUCET_PK is not set');
  }
  if (!faucetPChainAddress) {
    throw new Error('env FAUCET_PCHAIN_ADDRESS is not set');
  }

  // set up config for *current* network
  // - config setup
  const config = CHAINS[chainId];
  if (!config) {
    throw new Error(
      `No configuration found for configured network ID ${chainId}`,
    );
  }
  // - blacklist setup
  config.blacklistedValidatorIds = (config.blacklistedValidatorIds || []).map(
    (id) => id.toLowerCase(),
  );
  // - api setup
  const pvmApi = new pvm.PVMApi(config.pChainRpcHost);
  // - check key
  const publicKey = secp256k1.getPublicKey(
    new Uint8Array(Buffer.from(faucetPK, 'hex')),
  );
  const derivedAddress = `P-${utils.formatBech32(
    config.testnet ? 'fuji' : 'avax',
    secp256k1.publicKeyBytesToAddress(publicKey),
  )}`;
  if (derivedAddress.toLowerCase() !== faucetPChainAddress.toLowerCase()) {
    throw new Error(
      `env FAUCET_PCHAIN_ADDRESS does not match FAUCET_PK: ${derivedAddress} != ${faucetPChainAddress}`,
    );
  }

  return { config, pvmApi, faucetPChainAddress, faucetPK, chainId };
};
