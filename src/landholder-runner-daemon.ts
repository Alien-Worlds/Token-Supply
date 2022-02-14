#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import { BatchRun, TableFetcher, SingleRun } from 'eosio-helpers';

const terra_account = process.env.LANDHOLDERS_ACCOUNT!;
const terraWorldXferKey = process.env.XFER_PRIVATE_KEY!;
const endpoint = process.env.ENDPOINT!;
const batchPermission = process.env.BATCH_PERMISSION!;

let sleepTime = 2000; // ms units

export const Sleep = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

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
  console.log('run_batch result:', result);
};

/**
 * Execute the run action on chain in a recursive loop until the batch run is complete
 * @param batch_size determines the number of lands to loop within contract run action.
 */
const processBatch_recursively = async (
  batch_size: number,
  submit_to_blockchain: boolean
) => {
  try {
    await execute_run_action(batch_size, submit_to_blockchain);
    await Sleep(sleepTime);
    await processBatch_recursively(batch_size, submit_to_blockchain);
  } catch (error: any) {
    if (error.message.includes('Not enough pay to distribute')) {
      console.log(
        'Completed processing pay batches with not enough pay to distribute.'
      );
    } else {
      // Unexpected error
      throw error;
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
      batch_size,
      limit: 5000,
      codeContract: terra_account,
      table: 'payouts',
      lower_bound: '',
      sleepMS: 100,
      scope: terra_account,
    });
  console.log('Processing for', claimers.length, 'claimers.');

  const result = await BatchRun({
    fields: claimers,
    batch_size,
    createAction: async (c: { receiver: any }) => ({
      authorization: [{ actor: terra_account, permission: batchPermission }],
      account: terra_account,
      name: 'claimpay',
      data: { receiver: c.receiver },
    }),
    eos_endpoint: endpoint,
    private_keys: [{ pk: terraWorldXferKey }],
    submit_to_blockchain,
  });
};

const run = async () => {
  const batch_size: number = JSON.parse(process.env.BATCH_SIZE!);
  const submit_to_blockchain: boolean = JSON.parse(
    process.env.SUBMIT_TO_BLOCKCHAIN!
  );

  console.log('batch size:', batch_size);

  while (true) {
    try {
      console.log('Timestamp:', new Date());
      await processBatch_recursively(batch_size, submit_to_blockchain);
      await run_claims(batch_size, submit_to_blockchain);
    } catch (error: any) {
      console.log('Unexpected error:', error);
    }
    await Sleep(60 * 60 * 1000);
  }
};

run();
