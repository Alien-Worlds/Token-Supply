/**
 * Array reducer which decreases the initial value by the given current value
 *
 * @param {number} initial
 * @param {number} value
 * @returns {number}
 */

export function balanceReducer(initial: number, value: number): number {
  return initial - value;
}

export const contractInterface = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    type: 'function',
  },
];
