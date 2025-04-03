export type ChainConfig = {
  testnet?: boolean;
  pChainRpcHost: string;
  pChainTxDelay: number;
  uptimeApiUrl: string;
  validatorBalanceThreshold: number;
  validatorBalanceTopUp: number;
  validatorDelay: number;
  validatorUptimeThresholdPercent: number;
  blacklistedValidatorIds: string[];
  faucetBalanceThresholdWarn: number;
  faucetBalanceThresholdError: number;
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
