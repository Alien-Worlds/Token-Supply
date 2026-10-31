import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('node-fetch', () => ({ default: fetchMock }));

import { WaxService } from './WaxService';

const respondWith = (json: unknown) =>
  fetchMock.mockResolvedValue({ json: async () => json });

describe('WaxService', () => {
  beforeEach(() => fetchMock.mockReset());

  it('throws when no endpoint is given', () => {
    expect(() => new WaxService('')).toThrow('Endpoint not specified');
  });

  describe('getCurrencyBalance', () => {
    it('posts the account to get_currency_balance and parses the amount', async () => {
      respondWith(['123.4567 TLM']);

      const balance = await new WaxService(
        'https://wax.test'
      ).getCurrencyBalance('some.account');

      expect(balance).toBe(123.4567);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://wax.test/v1/chain/get_currency_balance');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({
        account: 'some.account',
        code: 'alien.worlds',
        symbol: 'TLM',
      });
    });

    it('returns 0 for an empty response', async () => {
      respondWith([]);
      expect(
        await new WaxService('https://wax.test').getCurrencyBalance('a')
      ).toBe(0);
    });

    it('returns 0 for a null response', async () => {
      respondWith(null);
      expect(
        await new WaxService('https://wax.test').getCurrencyBalance('a')
      ).toBe(0);
    });
  });

  describe('getSupply', () => {
    it('posts to get_currency_stats and parses the supply', async () => {
      respondWith({ TLM: { supply: '9876543.2100 TLM' } });

      const supply = await new WaxService('https://wax.test').getSupply();

      expect(supply).toBe(9876543.21);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://wax.test/v1/chain/get_currency_stats'
      );
    });

    it('rejects when the response has no TLM stats', async () => {
      respondWith({});
      await expect(
        new WaxService('https://wax.test').getSupply()
      ).rejects.toThrow();
    });
  });
});
