import {
  excludedEthAccounts,
  excludedBscAccounts,
  excludedWaxAccounts,
} from './excludedAccounts';
import { WaxService } from './WaxService';
import { EVMContractService } from './EVMContractService';
import { balanceReducer } from './common';

/**
 * Gets circulating supply
 *
 * @async
 * @param {WaxService} waxService
 * @param {EVMContractService} ethContractService
 * @param {EVMContractService} bscContractService
 * @returns {string}
 */

export async function getCirculatingSupply(
  waxService: WaxService,
  ethContractService: EVMContractService,
  bscContractService: EVMContractService,
  localised: string | undefined
): Promise<string | number> {
  const supply = await waxService.getSupply();
  const waxBalances = await Promise.all(
    excludedWaxAccounts.map(
      async account => await waxService.getCurrencyBalance(account.account)
    )
  );

  const ethBalances = await Promise.all(
    excludedEthAccounts.map(
      async account => await ethContractService.getBalance(account.account)
    )
  );

  const bscBalances = await Promise.all(
    excludedBscAccounts.map(
      async account => await bscContractService.getBalance(account.account)
    )
  );

  const result = [...waxBalances, ...ethBalances, ...bscBalances].reduce(
    balanceReducer,
    supply
  );

  return localised
    ? result.toLocaleString(localised, {
        maximumFractionDigits: 4,
        minimumFractionDigits: 4,
      }) + ' TLM'
    : result;
}
