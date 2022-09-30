#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import { BatchRun, TableFetcher, SingleRun, Sleep } from 'eosio-helpers';
// import { SecretsManager } from 'aws-secrets-manager';

const terra_account = process.env.LANDHOLDERS_ACCOUNT;
const terraWorldXferKey = process.env.XFER_PRIVATE_KEY;
const endpoint = process.env.ENDPOINT;
const batchPermission = process.env.BATCH_PERMISSION;

const sleepTime = 0; // ms units

/**
 * Execute the run contract action. This should be run in a loop until it throws an error
 * @param batchSize determines the number of lands to loop within contract run action.
 */
const execute_run_action = async (
  batchSize: number,
  submit_to_blockchain: boolean
) => {
  const result = await SingleRun({
    actions: [
      {
        authorization: [{ actor: terra_account, permission: batchPermission }],
        account: terra_account,
        name: 'run',
        data: { batchSize },
      },
    ],
    eos_endpoint: endpoint,
    private_keys: [{ pk: terraWorldXferKey }],
    submit_to_blockchain,
  });
  console.log('run_batch result:', result.transaction_id);
};

/**
 * Execute the run action on chain in a recursive loop until the batch run is complete
 * @param batch_size determines the number of lands to loop within contract run action.
 */
const process_due_payments = async (
  batch_size: number,
  submit_to_blockchain: boolean
) => {
  let should_keep_trying = true;

  while (should_keep_trying) {
    try {
      await execute_run_action(batch_size, submit_to_blockchain);
      await Sleep(10000);
    } catch (error) {
      if (error.message) {
        if (error.message.includes('RpcError')) {
          console.log('will retry now after a temporary error.');
          await Sleep(sleepTime);
        } else if (error.message.includes('Not enough pay to distribute')) {
          console.log('Completed processing pay batches.');
          should_keep_trying = false;
        } else {
          // Unexpected error
          throw error;
        }
      }
    }
  }
};

/**
 * Execute all the claim actions for the landowners
 * @param batchSize determines the number of claims to run within each blockchain transaction.
 */
const run_claims = async (
  batch_size: number,
  submit_to_blockchain: boolean
) => {
  const claimers: { receiver: string; payoutAmount: string }[] =
    await TableFetcher({
      endpoint: endpoint,
      batch_size: 1000,
      limit: 5000,
      codeContract: terra_account,
      table: 'payouts',
      lower_bound: '',
      sleepMS: 100,
      scope: terra_account,
    });
  if (claimers.length == 0) {
    console.log('No pending claims to be paid... exiting');
    return;
  }
  await BatchRun({
    fields: claimers,
    batch_size,
    createAction: async (c: { receiver: string }) => ({
      authorization: [{ actor: terra_account, permission: batchPermission }],
      account: terra_account,
      name: 'claimpay',
      data: { receiver: c.receiver },
    }),
    eos_endpoint: endpoint,
    private_keys: [{ pk: terraWorldXferKey }],
    submit_to_blockchain,
  });
  console.log(
    'Completed processing claims to',
    claimers.length,
    'land holders.'
  );
};

export const run = async (): Promise<void> => {
  // terraWorldXferKey = await getkey();

  const batch_size: number = JSON.parse(process.env.BATCH_SIZE);
  const submit_to_blockchain = true;

  try {
    await process_due_payments(batch_size, submit_to_blockchain);
    await run_claims(batch_size, submit_to_blockchain);
  } catch (error) {
    console.log('error in main run:', error);
  }
};

// run();
/*
const getkey = async (): Promise<string> => {
  // Use this code snippet in your app.
  // If you need more information about configurations or implementing the sample code, visit the AWS docs:
  // https://aws.amazon.com/developers/getting-started/nodejs/

  // Load the AWS SDK
  const region = 'us-east-1';
  const secretName = 'landholders_runbatch_private_key';
  let secret: string;

  // Create a Secrets Manager client
  const client = new SecretsManager({
    region: region,
  });

  // In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
  // See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
  // We rethrow the exception by default.

  try {
    const data = await client.getSecretValue({ SecretId: secretName });
    if ('SecretString' in data) {
      secret = data.SecretString;
    } else {
      const buff = Buffer.from(data.SecretBinary, 'base64');
      return buff.toString('ascii');
    }
  } catch (err) {
    if (err.code === 'DecryptionFailureException')
      // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
    else if (err.code === 'InternalServiceErrorException')
      // An error occurred on the server side.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
    else if (err.code === 'InvalidParameterException')
      // You provided an invalid value for a parameter.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
    else if (err.code === 'InvalidRequestException')
      // You provided a parameter value that is not valid for the current state of the resource.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
    else if (err.code === 'ResourceNotFoundException')
      // We can't find the resource that you asked for.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw err;
  }
};
*/
