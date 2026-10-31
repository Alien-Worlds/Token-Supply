import { describe, expect, it, vi } from 'vitest';
import { getCirculatingSupply } from './getCirculatingSupply';
import {
  excludedBscAccounts,
  excludedEthAccounts,
  excludedWaxAccounts,
} from './excludedAccounts';
import {
  BSC_BALANCE,
  ETH_BALANCE,
  fakeEvm,
  fakeWax,
  TOTAL_SUPPLY,
  totalExcluded,
} from './fakes';

describe('getCirculatingSupply', () => {
  it('subtracts every excluded balance from the total supply', async () => {
    const result = await getCirculatingSupply(
      fakeWax(),
      fakeEvm(ETH_BALANCE),
      fakeEvm(BSC_BALANCE),
      undefined
    );
    expect(result).toBe(TOTAL_SUPPLY - totalExcluded);
  });

  it('queries one balance per excluded account on each chain', async () => {
    const wax = fakeWax();
    const eth = fakeEvm(ETH_BALANCE);
    const bsc = fakeEvm(BSC_BALANCE);
    const waxSpy = vi.spyOn(wax, 'getCurrencyBalance');
    const ethSpy = vi.spyOn(eth, 'getBalance');
    const bscSpy = vi.spyOn(bsc, 'getBalance');

    await getCirculatingSupply(wax, eth, bsc, undefined);

    expect(waxSpy).toHaveBeenCalledTimes(excludedWaxAccounts.length);
    expect(ethSpy).toHaveBeenCalledTimes(excludedEthAccounts.length);
    expect(bscSpy).toHaveBeenCalledTimes(excludedBscAccounts.length);
    expect(ethSpy).toHaveBeenCalledWith(excludedEthAccounts[0].account);
  });

  it('formats the result when localised', async () => {
    const result = await getCirculatingSupply(
      fakeWax(),
      fakeEvm(ETH_BALANCE),
      fakeEvm(BSC_BALANCE),
      'en-US'
    );
    expect(result).toBe(
      (TOTAL_SUPPLY - totalExcluded).toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }) + ' TLM'
    );
  });

  it('propagates a failure from any data source', async () => {
    const eth = {
      getBalance: async () => {
        throw new Error('rpc down');
      },
    } as any;
    await expect(
      getCirculatingSupply(fakeWax(), eth, fakeEvm(BSC_BALANCE), undefined)
    ).rejects.toThrow('rpc down');
  });
});
