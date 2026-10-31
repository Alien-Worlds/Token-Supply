import {
  excludedBscAccounts,
  excludedEthAccounts,
  excludedWaxAccounts,
} from './excludedAccounts';
import { EVMContractService } from './EVMContractService';
import { WaxService } from './WaxService';

export const TOTAL_SUPPLY = 1000000;
export const WAX_BALANCE = 10;
export const ETH_BALANCE = 20;
export const BSC_BALANCE = 30;

export const totalExcluded =
  excludedWaxAccounts.length * WAX_BALANCE +
  excludedEthAccounts.length * ETH_BALANCE +
  excludedBscAccounts.length * BSC_BALANCE;

export const fakeWax = () =>
  ({
    getSupply: async () => TOTAL_SUPPLY,
    getCurrencyBalance: async () => WAX_BALANCE,
  } as unknown as WaxService);

export const fakeEvm = (balance: number) =>
  ({ getBalance: async () => balance } as unknown as EVMContractService);
