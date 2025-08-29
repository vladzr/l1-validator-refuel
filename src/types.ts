export type ChainConfig = {
  testnet?: boolean;
  pChainRpcHost: string;
  pChainTxDelay: number;
  validatorBalanceThreshold: number;
  validatorBalanceTopUp: number;
  validatorDelay: number;
  validatorUptimeThresholdPercent: number;
  blacklistedValidatorIds: string[];
  faucetBalanceThresholdWarn: number;
  faucetBalanceThresholdError: number;
  useValidatorUptimeFilter: boolean;
  evmChainRpcHost?: string;
  blockchainId: string;
};

export type ValidationInfo = {
  validationID: string;
  nodeID: string;
  weight: number;
  startTimestamp: number;
  isActive: boolean;
  isL1Validator: boolean;
  isConnected: boolean;
  uptimePercentage: number;
  uptimeSeconds: number;
};
