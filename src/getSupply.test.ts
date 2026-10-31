import { describe, expect, it } from 'vitest';
import { getSupply } from './getSupply';
import { fakeWax, TOTAL_SUPPLY } from './fakes';

describe('getSupply', () => {
  it('returns the raw supply number when not localised', async () => {
    expect(await getSupply(fakeWax(), undefined)).toBe(TOTAL_SUPPLY);
  });

  it('formats with four decimals and a TLM suffix when localised', async () => {
    expect(await getSupply(fakeWax(), 'en-US')).toBe('1,000,000.0000 TLM');
  });

  it('honours the locale separators', async () => {
    expect(await getSupply(fakeWax(), 'de-DE')).toBe('1.000.000,0000 TLM');
  });
});
