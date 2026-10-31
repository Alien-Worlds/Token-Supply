import { describe, expect, it } from 'vitest';
import { getTokenSupplies } from './getTokenSupplies';
import {
  BSC_BALANCE,
  ETH_BALANCE,
  fakeEvm,
  fakeWax,
  TOTAL_SUPPLY,
  totalExcluded,
} from './fakes';

const run = (type: string, localised?: string) =>
  getTokenSupplies(
    type,
    fakeWax(),
    fakeEvm(ETH_BALANCE),
    fakeEvm(BSC_BALANCE),
    localised
  );

describe('getTokenSupplies', () => {
  it('routes "supply" to the total supply', async () => {
    expect(await run('supply')).toBe(TOTAL_SUPPLY);
  });

  it('routes "circulating" to the circulating supply', async () => {
    expect(await run('circulating')).toBe(TOTAL_SUPPLY - totalExcluded);
  });

  it('routes "detailed" to the detailed breakdown', async () => {
    expect(await run('detailed')).toMatchObject({
      total_supply: TOTAL_SUPPLY,
    });
  });

  it('rejects an unknown type', async () => {
    expect(await run('bogus')).toBe('Invalid type');
  });
});
