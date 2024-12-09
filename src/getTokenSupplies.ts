import { WaxService } from './WaxService';
import { EVMContractService } from './EVMContractService';
import { getCirculatingSupply } from './getCirculatingSupply';
import { getDetailedCirculatingSupply } from './getDetailedCirculatingSupply';
import { getSupply } from './getSupply';

/**
 * Fetch current or circulating supply
 *
 * @async
 * @param {Request} request
 * @param {WaxService} waxService
 * @param {EVMContractService} ethContractService
 * @param {EVMContractService} bscContractService
 * @param {EVMContractService} localised
 * @returns
 */

export async function getTokenSupplies(
  type: string,
  waxService: WaxService,
  ethContractService: EVMContractService,
  bscContractService: EVMContractService,
  localised: string | undefined
) {
  if (type == 'supply') {
    return await getSupply(waxService, localised);
  }

  if (type == 'circulating') {
    return getCirculatingSupply(
      waxService,
      ethContractService,
      bscContractService,
      localised
    );
  }
  if (type == 'detailed') {
    return getDetailedCirculatingSupply(
      waxService,
      ethContractService,
      bscContractService,
      localised
    );
  }

  return 'Invalid type';
}
