import { describe, expect, it } from 'vitest';
import { getDetailedCirculatingSupply } from './getDetailedCirculatingSupply';
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
  WAX_BALANCE,
} from './fakes';

describe('getDetailedCirculatingSupply', () => {
  it('reports total supply, per-chain exclusions and the remainder', async () => {
    const result = await getDetailedCirculatingSupply(
      fakeWax(),
      fakeEvm(ETH_BALANCE),
      fakeEvm(BSC_BALANCE),
      undefined
    );

    expect(result.total_supply).toBe(TOTAL_SUPPLY);
    expect(result.exclusions.wax).toHaveLength(excludedWaxAccounts.length);
    expect(result.exclusions.eth).toHaveLength(excludedEthAccounts.length);
    expect(result.exclusions.bsc).toHaveLength(excludedBscAccounts.length);
    expect(result.supply_after_exclusions).toBe(
      (TOTAL_SUPPLY - totalExcluded).toFixed(4)
    );
  });

  it('attaches the fetched balance to each excluded account', async () => {
    const result = await getDetailedCirculatingSupply(
      fakeWax(),
      fakeEvm(ETH_BALANCE),
      fakeEvm(BSC_BALANCE),
      undefined
    );

    expect(result.exclusions.wax[0]).toEqual({
      ...excludedWaxAccounts[0],
      balance: WAX_BALANCE,
    });
    expect(result.exclusions.eth[0].balance).toBe(ETH_BALANCE);
    expect(result.exclusions.bsc[0].balance).toBe(BSC_BALANCE);
  });

  it('formats the remainder when localised', async () => {
    const result = await getDetailedCirculatingSupply(
      fakeWax(),
      fakeEvm(ETH_BALANCE),
      fakeEvm(BSC_BALANCE),
      'en-US'
    );
    expect(result.supply_after_exclusions).toMatch(/^[\d,]+\.\d{4} TLM$/);
  });
});
