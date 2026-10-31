import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ getTokenSupplies: vi.fn() }));
vi.mock('./getTokenSupplies', () => ({
  getTokenSupplies: mocks.getTokenSupplies,
}));

import { app, getSupply } from './app';

describe('app', () => {
  beforeEach(() => {
    vi.stubEnv('WAX_ENDPOINT', 'https://wax.test');
    vi.stubEnv('ETH_ENDPOINT', 'https://eth.test');
    vi.stubEnv('BSC_ENDPOINT', 'https://bsc.test');
    vi.stubEnv('ETH_TOKEN_CONTRACT', '0xeth');
    vi.stubEnv('BSC_TOKEN_CONTRACT', '0xbsc');
    mocks.getTokenSupplies.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  describe('GET /token', () => {
    it('defaults to the circulating type with no localisation', async () => {
      mocks.getTokenSupplies.mockResolvedValue(42);

      const res = await request(app).get('/token');

      expect(res.status).toBe(200);
      expect(res.body).toBe(42);
      const args = mocks.getTokenSupplies.mock.calls[0];
      expect(args[0]).toBe('circulating');
      expect(args[4]).toBeNull();
    });

    it('passes the type and localised query parameters through', async () => {
      mocks.getTokenSupplies.mockResolvedValue('1.0000 TLM');

      const res = await request(app).get('/token?type=supply&localised=en-US');

      expect(res.body).toBe('1.0000 TLM');
      const args = mocks.getTokenSupplies.mock.calls[0];
      expect(args[0]).toBe('supply');
      expect(args[4]).toBe('en-US');
    });

    it('serialises an object result as JSON', async () => {
      mocks.getTokenSupplies.mockResolvedValue({ total_supply: 1 });

      const res = await request(app).get('/token?type=detailed');

      expect(res.body).toEqual({ total_supply: 1 });
    });
  });

  describe('getSupply', () => {
    it('builds services from the environment and delegates', async () => {
      mocks.getTokenSupplies.mockResolvedValue(7);

      expect(await getSupply('supply', 'en-US')).toBe(7);
      expect(mocks.getTokenSupplies).toHaveBeenCalledOnce();
    });

    it('fails when the WAX endpoint is not configured', async () => {
      vi.stubEnv('WAX_ENDPOINT', '');
      await expect(getSupply('supply', null)).rejects.toThrow(
        'Endpoint not specified'
      );
    });

    it('fails when an EVM endpoint is not configured', async () => {
      vi.stubEnv('ETH_ENDPOINT', '');
      await expect(getSupply('supply', null)).rejects.toThrow(
        'One or more arguments were not specified'
      );
    });
  });
});
