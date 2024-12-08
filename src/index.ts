#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { ALBEvent } from 'aws-lambda';
dotenv.config();

import config from './config';

// import yargs from 'yargs';
import { WaxService } from './WaxService';
import { EVMContractService } from './EVMContractService';
import { getTokenSupplies } from './getTokenSupplies';
import { contractInterface } from './common';

/**
 * Represents the available /asset request query options
 * @type
 */
type TokenRequestQueryOptions = {
  type?: 'circulating' | 'supply' | 'detailed';
  offset?: number;
  id?: string;
  owner?: string;
  schema?: string;
};

export const handler = async (event: ALBEvent) => {
  let type: 'circulating' | 'supply' | 'detailed' = 'circulating';
  let localised = null;

  if (event.queryStringParameters) {
    const params = event.queryStringParameters;
    switch (params['type']) {
      case 'detailed':
        type = 'detailed';
        break;
      case 'supply':
        type = 'supply';
        break;
      default:
        type = 'circulating';
    }
    localised = params['localised'];
  }
  return await getSupply(type, localised);
};

export async function getSupply(type: string, localised: string) {
  const waxService = new WaxService(config.eos.endpoint);
  const ethContractService = new EVMContractService(
    config.eth.endpoint,
    config.eth.tokenContract,
    contractInterface
  );
  const bscContractService = new EVMContractService(
    config.bsc.endpoint,
    config.bsc.tokenContract,
    contractInterface
  );

  // const { type }: TokenRequestQueryOptions = request.query || {};
  const res = await getTokenSupplies(
    type,
    waxService,
    ethContractService,
    bscContractService,
    localised
  );

  console.log(JSON.stringify(res, null, 4));

  const response = {
    statusCode: 200,
    body: res,
  };
  return response;
}
