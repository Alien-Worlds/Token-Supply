#!/usr/bin/env node
import yargs from 'yargs';
import { getSupply } from '.';

(async () => {
  const { type, localised } = await yargs(process.argv).options({
    submit_to_blockchain: {
      boolean: true,
      demandOption: false,
      default: false,
      alias: 's',
    },
    type: {
      string: true,
      demandOption: true,
      alias: 't',
    },
    localised: {
      string: true,
      demandOption: false,
      alias: 'l',
    },
  }).argv;
  getSupply(type, localised);
})().catch(e => {
  console.error('error: ', e);
});
