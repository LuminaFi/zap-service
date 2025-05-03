import { ethers } from "ethers";
import { ServiceError } from "../types";
import config from "../config/config";
import { isValidAddress } from "../utils/blockchain";

/**
 * Interface for balance response
 */
export interface BalanceResponse {
  address: string;
  balance: string;
  formattedBalance: string;
  tokenSymbol: string;
  tokenAddress: string;
  timestamp: number;
}

/**
 * Service for retrieving IDRX token balances
 */
export class IDRXBalanceService {
  private provider: ethers.providers.JsonRpcProvider;
  private tokenAddress: string;
  private tokenAbi: string[];

  constructor() {
    this.tokenAddress = process.env.IDRX_TOKEN_ADDRESS || "";
    if (!this.tokenAddress || !ethers.utils.isAddress(this.tokenAddress)) {
      console.warn(
        "Invalid or missing IDRX_TOKEN_ADDRESS in environment variables"
      );
    }

    this.tokenAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)",
    ];

    this.provider = new ethers.providers.JsonRpcProvider(
      config.blockchain.liskRpcUrl
    );
  }

  /**
   * Get IDRX balance for an address
   * @param address Ethereum-compatible address to check balance for
   * @returns Balance response with formatted values
   */
  public async getBalance(address: string): Promise<BalanceResponse> {
    if (!this.tokenAddress) {
      throw new ServiceError("IDRX token address not configured", 500);
    }

    if (!isValidAddress(address)) {
      throw new ServiceError("Invalid address format", 400);
    }

    try {
      const tokenContract = new ethers.Contract(
        this.tokenAddress,
        this.tokenAbi,
        this.provider
      );

      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();

      const formattedBalance = ethers.utils.formatUnits(balance, decimals);

      return {
        address,
        balance: balance.toString(),
        formattedBalance,
        tokenSymbol: symbol,
        tokenAddress: this.tokenAddress,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error fetching IDRX balance for ${address}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to fetch IDRX balance: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Get token details
   * @returns Token information including name, symbol, and address
   */
  public async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    address: string;
    decimals: number;
  }> {
    if (!this.tokenAddress) {
      throw new ServiceError("IDRX token address not configured", 500);
    }

    try {
      const tokenContract = new ethers.Contract(
        this.tokenAddress,
        this.tokenAbi,
        this.provider
      );

      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();

      return {
        name,
        symbol,
        address: this.tokenAddress,
        decimals,
      };
    } catch (error) {
      console.error("Error fetching IDRX token info:", error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to fetch IDRX token info: ${(error as any).message}`,
        500
      );
    }
  }
}

export default new IDRXBalanceService();
