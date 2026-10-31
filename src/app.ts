import express from 'express';
import { WaxService } from './WaxService';
import { EVMContractService } from './EVMContractService';
import { getTokenSupplies } from './getTokenSupplies';
import { contractInterface } from './common';

export const app = express();

app.get('/token', async (req, res) => {
  const { type, localised } = req.query;
  const _type = typeof type === 'string' ? type : 'circulating';
  const _localised = typeof localised === 'string' ? localised : null;
  try {
    const _res = await getSupply(_type, _localised);
    res.json(_res);
  } catch (error) {
    // Log the detail server-side only: RPC errors can include endpoint URLs
    // carrying API keys, so the response body stays generic.
    console.error('Failed to fetch token supply:', error);
    res.status(500).json({ error: 'Failed to fetch token supply' });
  }
});

export async function getSupply(type: string, localised: string) {
  const waxService = new WaxService(process.env.WAX_ENDPOINT);
  const ethContractService = new EVMContractService(
    process.env.ETH_ENDPOINT,
    process.env.ETH_TOKEN_CONTRACT,
    contractInterface
  );
  const bscContractService = new EVMContractService(
    process.env.BSC_ENDPOINT,
    process.env.BSC_TOKEN_CONTRACT,
    contractInterface
  );

  return await getTokenSupplies(
    type,
    waxService,
    ethContractService,
    bscContractService,
    localised
  );
}
