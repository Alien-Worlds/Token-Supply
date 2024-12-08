import fetch from 'node-fetch';

/**
 * Class representing a WaxService instance.
 * WaxService is the data source responsible for communicating with the WAX endpoint API
 *
 * @class
 */

export class WaxService {
  private _balanceUrl: string;
  private _statsUrl: string;

  constructor(endpoint: string) {
    if (!endpoint) {
      throw new Error('Endpoint not specified');
    }

    this._balanceUrl = `${endpoint}/v1/chain/get_currency_balance`;
    this._statsUrl = `${endpoint}/v1/chain/get_currency_stats`;
  }

  /**
   * Gets the currency balance for the given account
   *
   * @async
   * @param {string} account wax account name
   * @returns {number} balance
   */
  public async getCurrencyBalance(account: string): Promise<number> {
    const res = await fetch(this._balanceUrl, {
      method: 'POST',
      body: JSON.stringify({
        account,
        code: 'alien.worlds',
        symbol: 'TLM',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();

    if (!json || json.length == 0) {
      return 0;
    }

    const [bal_str] = json[0].split(' ');

    return parseFloat(bal_str);
  }

  /**
   * Gets the value of supply from the current currency statistics
   *
   * @async
   * @returns {number} supply
   */
  public async getSupply(): Promise<number> {
    const res = await fetch(this._statsUrl, {
      method: 'POST',
      body: JSON.stringify({
        json: true,
        code: 'alien.worlds',
        symbol: 'TLM',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return parseFloat(json.TLM.supply.replace(' TLM', ''));
  }
}
