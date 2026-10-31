import { describe, expect, it } from 'vitest';
import { balanceReducer, contractInterface } from './common';

describe('balanceReducer', () => {
  it('subtracts the value from the initial amount', () => {
    expect(balanceReducer(100, 40)).toBe(60);
  });

  it('reduces an array of balances from a starting supply', () => {
    expect([10, 20, 30].reduce(balanceReducer, 100)).toBe(40);
  });
});

describe('contractInterface', () => {
  it('exposes balanceOf(address)', () => {
    expect(contractInterface).toHaveLength(1);
    expect(contractInterface[0].name).toBe('balanceOf');
    expect(contractInterface[0].inputs[0].type).toBe('address');
  });
});
