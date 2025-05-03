import axios from "axios";
import { ServiceError } from "../types";
import {
  normalizeTokenId,
  getTokenInfoBySymbol,
  getSupportedNetworks,
  getSupportedTokensForNetwork,
  TOKEN_INFO,
} from "../constants/tokens";

/**
 * Interface for token price data
 */
export interface TokenPriceData {
  token: string;
  tokenSymbol: string;
  priceUsd: number;
  priceIdr: number;
  timestamp: number;
}

/**
 * Interface for fee calculation result
 */
export interface FeeCalculationResult {
  token: string;
  tokenSymbol: string;
  priceUsd: number;
  priceIdr: number;
  adminFeePercentage: number;
  adminFeeAmount: number;
  spreadFeePercentage: number;
  spreadFeeAmount: number;
  totalFeePercentage: number;
  totalFeeAmount: number;
  amountBeforeFees: number;
  amountAfterFees: number;
  exchangeRate: number;
  timestamp: number;
}

/**
 * Interface for volatility calculation result
 */
export interface VolatilityResult {
  token: string;
  volatility: number;
  recommendedSpreadFee: number;
  timeframe: string;
  timestamp: number;
}

/**
 * Interface for network token support
 */
export interface NetworkTokenSupport {
  network: string;
  tokens: string[];
}

/**
 * Service for calculating token prices, admin fees, and spread fees
 */
export class TokenFeeService {
  private readonly CMC_API_URL = "https://pro-api.coinmarketcap.com/v1";
  private readonly CMC_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
  private IDR_TO_USD_RATE = 15500;
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private priceCache: Map<string, { data: TokenPriceData; timestamp: number }>;
  private volatilityCache: Map<
    string,
    { result: VolatilityResult; timestamp: number }
  >;

  private readonly ADMIN_FEE_PERCENTAGE = 0.005;

  private readonly DEFAULT_SPREAD_FEE_PERCENTAGE = 0.002;

  constructor() {
    this.priceCache = new Map();
    this.volatilityCache = new Map();
    this.updateIdrUsdRate();

    setInterval(() => this.updateIdrUsdRate(), 60 * 60 * 1000);

    if (!this.CMC_API_KEY) {
      console.warn(
        "COINMARKETCAP_API_KEY is not set in environment variables. API calls may fail."
      );
    }
  }

  /**
   * Get token price data in USD and IDR
   * @param token Token to get price for (eth, sol, etc.)
   * @returns Token price data
   */
  public async getTokenPrice(token: string): Promise<TokenPriceData> {
    const normalizedToken = normalizeTokenId(token);

    const cachedData = this.priceCache.get(normalizedToken);
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_TTL) {
      return cachedData.data;
    }

    try {
      const tokenInfo = Object.values(TOKEN_INFO).find(
        (info) => info.id === normalizedToken
      );
      const tokenSymbol = tokenInfo ? tokenInfo.symbol : token.toUpperCase();

      const response = await axios.get(
        `${this.CMC_API_URL}/cryptocurrency/quotes/latest`,
        {
          params: {
            symbol: tokenSymbol,
            convert: "USD",
          },
          headers: {
            "X-CMC_PRO_API_KEY": this.CMC_API_KEY,
          },
          timeout: 10000,
        }
      );

      if (
        !response.data ||
        !response.data.data ||
        !response.data.data[tokenSymbol]
      ) {
        throw new ServiceError(
          `Token ${token} not found on CoinMarketCap`,
          404
        );
      }

      const tokenData = response.data.data[tokenSymbol];
      const priceUsd = tokenData.quote.USD.price;

      const priceIdr = priceUsd * this.IDR_TO_USD_RATE;

      const result: TokenPriceData = {
        token: normalizedToken,
        tokenSymbol,
        priceUsd,
        priceIdr,
        timestamp: Date.now(),
      };

      this.priceCache.set(normalizedToken, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Error fetching price for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      if ((error as any).response && (error as any).response.status === 429) {
        throw new ServiceError(
          "CoinMarketCap API rate limit exceeded. Please try again later.",
          429
        );
      }

      throw new ServiceError(
        `Failed to get token price: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate fees for a token amount
   * @param token Token to calculate fees for (eth, sol, etc.)
   * @param amount Amount of the token
   * @param customSpreadFee Optional custom spread fee percentage (0.01 = 1%)
   * @returns Fee calculation result
   */
  public async calculateFees(
    token: string,
    amount: number,
    customSpreadFee?: number
  ): Promise<FeeCalculationResult> {
    if (amount <= 0) {
      throw new ServiceError("Amount must be greater than 0", 400);
    }

    try {
      const priceData = await this.getTokenPrice(token);

      let spreadFeePercentage = this.DEFAULT_SPREAD_FEE_PERCENTAGE;

      if (customSpreadFee !== undefined) {
        spreadFeePercentage = customSpreadFee;
      } else {
        try {
          const volatility = await this.calculateVolatility(token, 1);
          spreadFeePercentage = volatility.recommendedSpreadFee;
        } catch (error) {
          console.warn(
            `Using default spread fee due to error calculating volatility: ${
              (error as any).message
            }`
          );
        }
      }

      const adminFeeAmount = amount * this.ADMIN_FEE_PERCENTAGE;

      const spreadFeeAmount = amount * spreadFeePercentage;

      const totalFeeAmount = adminFeeAmount + spreadFeeAmount;
      const totalFeePercentage =
        this.ADMIN_FEE_PERCENTAGE + spreadFeePercentage;

      const amountBeforeFees = amount;
      const amountAfterFees = amount - totalFeeAmount;

      const exchangeRate = priceData.priceIdr;

      return {
        token: priceData.token,
        tokenSymbol: priceData.tokenSymbol,
        priceUsd: priceData.priceUsd,
        priceIdr: priceData.priceIdr,
        adminFeePercentage: this.ADMIN_FEE_PERCENTAGE,
        adminFeeAmount,
        spreadFeePercentage,
        spreadFeeAmount,
        totalFeePercentage,
        totalFeeAmount,
        amountBeforeFees,
        amountAfterFees,
        exchangeRate,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error calculating fees for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to calculate fees: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate IDRX amount from source token amount
   * @param token Source token (eth, sol, etc.)
   * @param amount Amount of source token
   * @param customSpreadFee Optional custom spread fee percentage
   * @returns IDRX amount and fee details
   */
  public async calculateIdrxAmount(
    token: string,
    amount: number,
    customSpreadFee?: number
  ): Promise<{
    idrxAmount: number;
    feeCalculation: FeeCalculationResult;
  }> {
    try {
      const feeCalculation = await this.calculateFees(
        token,
        amount,
        customSpreadFee
      );

      const idrxAmount =
        feeCalculation.amountAfterFees * feeCalculation.exchangeRate;

      return {
        idrxAmount,
        feeCalculation,
      };
    } catch (error) {
      console.error(`Error calculating IDRX amount for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to calculate IDRX amount: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate source token amount needed for a specific IDRX amount
   * @param token Source token (eth, sol, etc.)
   * @param idrxAmount Desired IDRX amount
   * @param customSpreadFee Optional custom spread fee percentage
   * @returns Source token amount and fee details
   */
  public async calculateSourceAmount(
    token: string,
    idrxAmount: number,
    customSpreadFee?: number
  ): Promise<{
    sourceAmount: number;
    feeCalculation: FeeCalculationResult;
  }> {
    if (idrxAmount <= 0) {
      throw new ServiceError("IDRX amount must be greater than 0", 400);
    }

    try {
      const priceData = await this.getTokenPrice(token);

      let spreadFeePercentage = this.DEFAULT_SPREAD_FEE_PERCENTAGE;

      if (customSpreadFee !== undefined) {
        spreadFeePercentage = customSpreadFee;
      } else {
        try {
          const volatility = await this.calculateVolatility(token, 1);
          spreadFeePercentage = volatility.recommendedSpreadFee;
        } catch (error) {
          console.warn(
            `Using default spread fee due to error calculating volatility: ${
              (error as any).message
            }`
          );
        }
      }

      const totalFeePercentage =
        this.ADMIN_FEE_PERCENTAGE + spreadFeePercentage;

      const exchangeRate = priceData.priceIdr;
      const sourceAmount =
        idrxAmount / (exchangeRate * (1 - totalFeePercentage));

      const feeCalculation = await this.calculateFees(
        token,
        sourceAmount,
        spreadFeePercentage
      );

      return {
        sourceAmount,
        feeCalculation,
      };
    } catch (error) {
      console.error(`Error calculating source amount for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to calculate source amount: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Update IDR to USD exchange rate
   * @returns Promise that resolves when update is complete
   */
  private async updateIdrUsdRate(): Promise<void> {
    try {
      const response = await axios.get(
        `${this.CMC_API_URL}/cryptocurrency/quotes/latest`,
        {
          params: {
            symbol: "USDT",
            convert: "IDR",
          },
          headers: {
            "X-CMC_PRO_API_KEY": this.CMC_API_KEY,
          },
          timeout: 10000,
        }
      );

      if (
        response.data &&
        response.data.data &&
        response.data.data.USDT &&
        response.data.data.USDT.quote &&
        response.data.data.USDT.quote.IDR
      ) {
        this.IDR_TO_USD_RATE = response.data.data.USDT.quote.IDR.price;
        console.log(`Updated IDR to USD rate: ${this.IDR_TO_USD_RATE}`);
      }
    } catch (error) {
      console.error("Error updating IDR to USD rate:", error);
    }
  }

  /**
   * Calculate market volatility for a token
   * @param token Token to calculate volatility for
   * @param days Number of days of price history to analyze
   * @returns Volatility result with recommended spread fee
   */
  public async calculateVolatility(
    token: string,
    days: number = 1
  ): Promise<VolatilityResult> {
    if (days < 1 || days > 30) {
      throw new ServiceError("Days parameter must be between 1 and 30", 400);
    }

    const normalizedToken = normalizeTokenId(token);

    const cacheKey = `${normalizedToken}-${days}`;

    const cachedResult = this.volatilityCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < this.CACHE_TTL) {
      return cachedResult.result;
    }

    try {
      const tokenInfo = Object.values(TOKEN_INFO).find(
        (info) => info.id === normalizedToken
      );
      const tokenSymbol = tokenInfo ? tokenInfo.symbol : token.toUpperCase();

      const response = await axios.get(
        `${this.CMC_API_URL}/cryptocurrency/quotes/latest`,
        {
          params: {
            symbol: tokenSymbol,
            convert: "USD",
          },
          headers: {
            "X-CMC_PRO_API_KEY": this.CMC_API_KEY,
          },
          timeout: 10000,
        }
      );

      if (
        !response.data ||
        !response.data.data ||
        !response.data.data[tokenSymbol]
      ) {
        throw new ServiceError(
          `Token ${token} not found on CoinMarketCap`,
          404
        );
      }

      const tokenData = response.data.data[tokenSymbol];

      const percentChange24h =
        Math.abs(tokenData.quote.USD.percent_change_24h || 0) / 100;

      const volatility =
        days === 1 ? percentChange24h : percentChange24h * Math.sqrt(days);

      const recommendedSpreadFee =
        this.calculateRecommendedSpreadFee(volatility);

      const result: VolatilityResult = {
        token: normalizedToken,
        volatility,
        recommendedSpreadFee,
        timeframe: `${days} day${days > 1 ? "s" : ""}`,
        timestamp: Date.now(),
      };

      this.volatilityCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Error calculating volatility for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      if ((error as any).response && (error as any).response.status === 429) {
        throw new ServiceError(
          "CoinMarketCap API rate limit exceeded. Please try again later.",
          429
        );
      }

      throw new ServiceError(
        `Failed to calculate volatility: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate recommended spread fee based on volatility
   * @param volatility Volatility as a decimal
   * @returns Recommended spread fee as a decimal (e.g., 0.01 = 1%)
   */
  private calculateRecommendedSpreadFee(volatility: number): number {
    const baseFee = 0.002;

    const volatilityComponent = volatility * 0.5;

    const maxFee = 0.02;

    const totalFee = baseFee + volatilityComponent;

    return Math.min(totalFee, maxFee);
  }

  /**
   * Get supported tokens by network
   * @returns Array of network with supported tokens
   */
  public getSupportedTokensByNetwork(): NetworkTokenSupport[] {
    const networks = getSupportedNetworks();

    return networks.map((network) => ({
      network,
      tokens: getSupportedTokensForNetwork(network),
    }));
  }

  /**
   * Get supported tokens list
   * @returns Array of supported tokens with their symbols
   */
  public getSupportedTokens(): Array<{ id: string; symbol: string }> {
    return Object.values(TOKEN_INFO).map((token) => ({
      id: token.id,
      symbol: token.symbol,
    }));
  }
}

export default new TokenFeeService();
