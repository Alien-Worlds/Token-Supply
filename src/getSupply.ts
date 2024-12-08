import { WaxService } from './WaxService';

/**
 * Gets the value of supply from the current currency statistics
 *
 * @async
 * @returns {number} supply
 */

export async function getSupply(
  waxService: WaxService,
  localised: string | undefined
): Promise<string | number> {
  const supply = await waxService.getSupply();
  return localised
    ? supply.toLocaleString(localised, {
        maximumFractionDigits: 4,
        minimumFractionDigits: 4,
      }) + ' TLM'
    : supply;
}
