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

  describe('GET /token failures', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => vi.restoreAllMocks());

    it('responds 500 with a generic JSON error when a data source fails', async () => {
      mocks.getTokenSupplies.mockRejectedValue(new Error('rpc down'));

      const res = await request(app).get('/token?type=supply');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to fetch token supply' });
    });

    it('does not leak the underlying error message to the client', async () => {
      mocks.getTokenSupplies.mockRejectedValue(
        new Error('https://eth.test/v3/SECRET_API_KEY failed')
      );

      const res = await request(app).get('/token');

      expect(res.text).not.toContain('SECRET_API_KEY');
    });

    it('logs the underlying error server-side', async () => {
      const error = new Error('rpc down');
      mocks.getTokenSupplies.mockRejectedValue(error);

      await request(app).get('/token');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch token supply:',
        error
      );
    });

    it('responds 500 when the service is misconfigured', async () => {
      vi.stubEnv('WAX_ENDPOINT', '');

      const res = await request(app).get('/token');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to fetch token supply' });
    });

    it('keeps serving requests after a failure', async () => {
      mocks.getTokenSupplies.mockRejectedValueOnce(new Error('rpc down'));
      mocks.getTokenSupplies.mockResolvedValueOnce(42);

      expect((await request(app).get('/token')).status).toBe(500);
      const ok = await request(app).get('/token');
      expect(ok.status).toBe(200);
      expect(ok.body).toBe(42);
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
