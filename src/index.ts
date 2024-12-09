import * as dotenv from 'dotenv';
dotenv.config();

const WAX_ENDPOINT = process.env.WAX_ENDPOINT;
const ETH_ENDPOINT = process.env.ETH_ENDPOINT;
const BSC_ENDPOINT = process.env.BSC_ENDPOINT;
const ETH_TOKEN_CONTRACT = process.env.ETH_TOKEN_CONTRACT;
const BSC_TOKEN_CONTRACT = process.env.BSC_TOKEN_CONTRACT;
const SERVER_PORT = process.env.SERVER_PORT;

import { WaxService } from './WaxService';
import { EVMContractService } from './EVMContractService';
import { getTokenSupplies } from './getTokenSupplies';
import { contractInterface } from './common';

import express from 'express';

const app = express();

app.get('/token', async (req, res) => {
  const { type, localised } = req.query;
  const _type = typeof type === 'string' ? type : 'circulating';
  const _localised = typeof localised === 'string' ? localised : null;
  const _res = await getSupply(_type, _localised);
  res.json(_res);
});

export async function getSupply(type: string, localised: string) {
  const waxService = new WaxService(WAX_ENDPOINT);
  const ethContractService = new EVMContractService(
    ETH_ENDPOINT,
    ETH_TOKEN_CONTRACT,
    contractInterface
  );
  const bscContractService = new EVMContractService(
    BSC_ENDPOINT,
    BSC_TOKEN_CONTRACT,
    contractInterface
  );

  const res = await getTokenSupplies(
    type,
    waxService,
    ethContractService,
    bscContractService,
    localised
  );

  // console.log(JSON.stringify(res, null, 4));

  return res;
}

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});
