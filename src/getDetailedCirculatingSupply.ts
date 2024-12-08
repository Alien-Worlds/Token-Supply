import {
  excludedEthAccounts,
  excludedBscAccounts,
  excludedWaxAccounts,
} from './excludedAccounts';
import { WaxService } from './WaxService';
import { EVMContractService } from './EVMContractService';
import { balanceReducer } from './common';

export type DetailedResponseType = {
  total_supply: number;
  exclusions: {
    wax: {
      balance: number;
      description: string;
      account: string;
    }[];
    eth: {
      balance: number;
      description: string;
      account: string;
    }[];
    bsc: {
      balance: number;
      description: string;
      account: string;
    }[];
  };
  supply_after_exclusions: string | number;
};

export async function getDetailedCirculatingSupply(
  waxService: WaxService,
  ethContractService: EVMContractService,
  bscContractService: EVMContractService,
  localised: string | undefined
): Promise<DetailedResponseType> {
  const supply = await waxService.getSupply();
  const waxBalances = await Promise.all(
    excludedWaxAccounts.map(async account => ({
      ...account,
      balance: await waxService.getCurrencyBalance(account.account),
    }))
  );
  const ethBalances = await Promise.all(
    excludedEthAccounts.map(async account => ({
      ...account,
      balance: await ethContractService.getBalance(account.account),
    }))
  );
  const bscBalances = await Promise.all(
    excludedBscAccounts.map(async account => ({
      ...account,
      balance: await bscContractService.getBalance(account.account),
    }))
  );

  const all = [...waxBalances, ...ethBalances, ...bscBalances];
  const balanceNumber = all.map(a => a.balance).reduce(balanceReducer, supply);

  const balance = localised
    ? balanceNumber.toLocaleString(localised, {
        maximumFractionDigits: 4,
        minimumFractionDigits: 4,
      }) + ' TLM'
    : balanceNumber.toFixed(4);

  return {
    total_supply: supply,
    exclusions: { wax: waxBalances, eth: ethBalances, bsc: bscBalances },
    supply_after_exclusions: balance,
  };
}
