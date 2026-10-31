import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  balanceOf: vi.fn(),
  Contract: vi.fn(),
  JsonRpcProvider: vi.fn(),
}));

vi.mock('ethers', () => {
  mocks.Contract.mockImplementation(function () {
    return { balanceOf: mocks.balanceOf };
  });
  return {
    Contract: mocks.Contract,
    providers: { JsonRpcProvider: mocks.JsonRpcProvider },
  };
});

import { EVMContractService } from './EVMContractService';
import { contractInterface } from './common';

describe('EVMContractService', () => {
  beforeEach(() => {
    mocks.balanceOf.mockReset();
    mocks.Contract.mockClear();
    mocks.JsonRpcProvider.mockClear();
  });

  it.each([
    ['endpoint', ['', '0xtoken', contractInterface]],
    ['token', ['https://rpc.test', '', contractInterface]],
    ['interface', ['https://rpc.test', '0xtoken', undefined]],
  ])('throws when the %s is missing', (_name, args) => {
    expect(() => new (EVMContractService as any)(...args)).toThrow(
      'One or more arguments were not specified'
    );
  });

  it('connects a contract to the endpoint and token', () => {
    new EVMContractService('https://rpc.test', '0xtoken', contractInterface);

    expect(mocks.JsonRpcProvider).toHaveBeenCalledWith('https://rpc.test');
    expect(mocks.Contract.mock.calls[0][0]).toBe('0xtoken');
    expect(mocks.Contract.mock.calls[0][1]).toBe(contractInterface);
  });

  it('scales the on-chain balance down by 10^4', async () => {
    mocks.balanceOf.mockResolvedValue({ toNumber: () => 1234567 });
    const service = new EVMContractService(
      'https://rpc.test',
      '0xtoken',
      contractInterface
    );

    expect(await service.getBalance('0xabc')).toBe(123.4567);
    expect(mocks.balanceOf).toHaveBeenCalledWith('0xabc');
  });
});
