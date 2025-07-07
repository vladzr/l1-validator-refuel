import { addTxSignatures, Context, pvm, utils } from '@avalabs/avalanchejs';
import { fromPChainWei, toPChainWei, wait } from './utils';
import { getConfig } from './config';
import type { ValidationInfo } from './types';

const { config, pvmApi, faucetPChainAddress, faucetPK, chainId } = getConfig();

// gets current validation info for all validators
const getValidationInfo = async (): Promise<ValidationInfo[]> => {
  // query validation info.
  const request = await fetch(config.uptimeApiUrl);

  if (!request.ok) {
    throw new Error(
      `Failed to fetch validator data - Error ${request.status}: ${request.statusText}`,
    );
  }
  const response = await request.json();
  if (!response.validators?.length) {
    throw new Error(
      `No validators found, API response: ${JSON.stringify(response, undefined, 2)}`,
    );
  }

  return response.validators;
};

// tops up validator
const increaseValidatorBalance = async (validationId: string) => {
  const senderPAddr = utils.bech32ToBytes(faucetPChainAddress);
  const { utxos } = await pvmApi.getUTXOs({
    addresses: [faucetPChainAddress],
  });
  const feeState = await pvmApi.getFeeState();

  let context;
  try {
    context = await Context.getContextFromURI(config.pChainRpcHost);
  } catch (e) {
    console.error(
      `Failed to fetch context from P-Chain RPC: ${config.pChainRpcHost}`,
    );
    if (e instanceof Error) {
      console.error('Error message:', e.message);
    } else {
      console.error('Unexpected error:', e);
    }
    throw e;
  }

  const tx = pvm.e.newIncreaseL1ValidatorBalanceTx(
    {
      balance: toPChainWei(config.validatorBalanceTopUp),
      feeState,
      fromAddressesBytes: [senderPAddr],
      utxos,
      validationId,
    },
    context,
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [utils.hexToBuffer(faucetPK)],
  });

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

// handler for single validator
export const handleValidator = async (validation: ValidationInfo) => {
  const { validationID, nodeID, uptimePercentage } = validation;
  try {
    const minValidatorBalance = toPChainWei(config.validatorBalanceThreshold);

    // get validator info incl. balance by validation ID
    let validator: pvm.L1ValidatorDetails;
    try {
      validator = await pvmApi.getL1Validator(validationID);
      // biome-ignore lint/correctness/noUnusedVariables: d'uh biome
    } catch (e) {
      console.error(
        `\nError resolving validation ID ${validationID} on P-Chain (probably PoA validator), skipping...`,
      );
      return;
    }

    console.info(
      `\nProcessing validator ${validator.nodeID} (validation ID ${validationID})...\n- balance: ${fromPChainWei(validator.balance)} AVAX.`,
    );

    if (
      config.useValidatorUptimeFilter &&
      uptimePercentage < config.validatorUptimeThresholdPercent
    ) {
      console.info(
        `- skipping inactive validator ${nodeID}, uptime of ${uptimePercentage.toFixed(1)}% is < ${config.validatorUptimeThresholdPercent}%.`,
      );

      return;
    }

    if (
      config.blacklistedValidatorIds.includes(validator.nodeID.toLowerCase())
    ) {
      console.info(
        `- skipping blacklisted validator ${validator.nodeID}, not topping up.`,
      );

      return;
    }

    // check validator balance
    if (validator.balance <= minValidatorBalance) {
      console.info(
        `- validator ${validator.nodeID} balance below ${config.validatorBalanceThreshold} AVAX, topping up ${config.validatorBalanceTopUp} AVAX.`,
      );

      // top up validator
      const { txID } = await increaseValidatorBalance(validationID);
      await wait(config.pChainTxDelay);

      const { status } = await pvmApi.getTxStatus({
        txID,
      });
      // const { tx } = await pvmApi.getTxJson({ txID });

      console.info(
        `- validator balance for ${validator.nodeID} topped up successfully! tx hash: ${txID}, status: ${status}`,
      );

      // re-check validator balance after top-up
      validator = await pvmApi.getL1Validator(validationID);
      if (validator.balance <= minValidatorBalance) {
        throw new Error(
          `- validator ${validator.nodeID} balance still below ${config.validatorBalanceThreshold} AVAX after top-up!`,
        );
      }
      console.info(
        `- validator ${validator.nodeID} balance now at ${fromPChainWei(
          validator.balance,
        )} AVAX.`,
      );
    } else {
      console.info(
        `- skipping validator, balance above ${config.validatorBalanceThreshold} AVAX.`,
      );
    }
  } catch (e) {
    console.error(`Error processing validation ID: ${validationID}`, e);
  }
};

// main handler to process all validators
export const handleRefuel = async () => {
  const startTime = Date.now();

  // get validation IDs
  const validationInfo = await getValidationInfo();

  // check faucet balance
  const { balance: faucetBalance } = await pvmApi.getBalance({
    addresses: [faucetPChainAddress],
  });

  console.info(
    `\nStarting refuel run for chain ID ${chainId}\n- faucet: ${faucetPChainAddress}, P-Chain balance: ${fromPChainWei(faucetBalance)} AVAX\n`,
  );

  if (faucetBalance < toPChainWei(config.faucetBalanceThresholdError)) {
    throw new Error(
      `Faucet P-Chain balance critically low (below ${config.faucetBalanceThresholdError} AVAX), aborting!`,
    );
  }

  if (faucetBalance < toPChainWei(config.faucetBalanceThresholdWarn)) {
    console.warn(
      `Warning, Faucet P-Chain balance below ${config.faucetBalanceThresholdWarn} AVAX!`,
    );
  }

  // process all L1 validators
  for (const validation of validationInfo) {
    await handleValidator(validation);

    // sleep to avoid rate limiting
    await wait(config.validatorDelay);
  }

  console.info(
    `\nRun completed in ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} minutes!`,
  );
};
