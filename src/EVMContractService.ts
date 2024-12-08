import { Contract, ContractInterface, providers } from 'ethers';

/**
 * Class representing a ContractService instance.
 * ContractService is the Ethers data source
 * responsible for communicating with the Contract on-chain
 *
 * @class
 * @see {@link https://docs.ethers.io/v5/api/contract/contract} for further information about the Contract class.
 */

export class EVMContractService {
  private provider: providers.JsonRpcProvider;
  private contract: Contract;

  /**
   * Creates instance of the ContractService attached to the given endpoint.
   *
   * @constructor
   * @param {string} endpoint
   * @param {string} token
   * @param {ContractInterface} contractInterface
   */
  constructor(
    endpoint: string,
    token: string,
    contractInterface: ContractInterface
  ) {
    if (!endpoint || !token || !contractInterface) {
      throw new Error('One or more arguments were not specified');
    }

    this.provider = new providers.JsonRpcProvider(endpoint);
    this.contract = new Contract(token, contractInterface, this.provider);
  }

  /**
   * Get balance of the given account
   *
   * @async
   * @param {string} address account address
   * @returns {number} balance
   */
  public async getBalance(address: string): Promise<number> {
    const balance = await this.contract.balanceOf(address);
    return balance.toNumber() / 10000;
  }
}
